import {
  createLidoSubmitTransaction,
  createLidoRequestWithdrawalApprovalTransaction,
  createLidoRequestWithdrawalTransaction,
  getLidoWithdrawalRequests,
  createLidoWithdrawalTransaction,
} from "./lido/lido";
import { Asset, OpportunityData, TokenInput, TransactionType, TxAssetAmountInfo } from "../dataModels";
import ServerSideTransactions from "./serverSideTransactions";
import {
  createCollectRewardsTransaction,
  createRedeemTotalUniswapLPTransactions,
  createUniswapMintLPTransaction,
  getUniswapLPInfo,
  getUniswapLPPositions,
} from "./uniswap/uniswap";
import {
  createAaveV3SupplyApprovalTransaction,
  createAaveV3SupplyTransaction,
  createAaveV3WithdrawTransaction,
} from "./aave/aave";
import { createDualTokenApprovalTransactions } from "./generic/approveErc20Token";
import { createKodiakIslandApprovalTransaction, createKodiakIslandMintTransaction, createKodiakIslandRedeemTransaction } from "./kodiakIsland/kodiakIsland";
import { createInfraredCollectRewardsTransaction, createInfraredStakeApprovalTransaction, createInfraredStakeTransaction, createInfraredWithdrawalTransaction } from "./infrared/infrared";
import { performCrossChainSwap } from "./crossChainSwaps/consumeCrossChainTokens";
import { PrivyClient } from "@privy-io/server-auth";
import { getChainById } from "@/database/queries";
import { getUserTokenBalanceInfo } from "@/libs/debank";


interface UserFungibleTokenBalanceInfo {
  tokenIdentifier: string;
  price: number;
  tokenAmount: number;
}
async function _getUserFungibleTokenBalanceInfo(
  userAddress: string,
  opportunity: OpportunityData,
  asset: Asset
): Promise<UserFungibleTokenBalanceInfo> {
  const tokenAddress = asset.address;
  const chainMetadata = await getChainById(opportunity.chain);
  if (!chainMetadata) {
    throw new Error(`Chain metadata not found for opportunity ${opportunity.id}`);
  }
  const debankChainId = chainMetadata.debankName;
  const tokenIdentifier = tokenAddress ? tokenAddress : debankChainId

  const userTokenBalanceInfo = await getUserTokenBalanceInfo(userAddress, debankChainId, tokenIdentifier);
  console.log("userTokenBalanceInfo", userTokenBalanceInfo);
  return {
    tokenIdentifier: tokenIdentifier,
    price: userTokenBalanceInfo.price,
    tokenAmount: userTokenBalanceInfo.amount,
  }
}

//This basically calculates net difference between pre and post investment snapshots.
async function generateTxAssetAmountInfo(
  preInvestmentSnapshots: UserFungibleTokenBalanceInfo[],
  postInvestmentSnapshots: UserFungibleTokenBalanceInfo[],
  assetList: Asset[]
): Promise<TxAssetAmountInfo[]> {
  let index = 0
  let inputTxAssetAmountInfo: TxAssetAmountInfo[] = []
  for (const asset of assetList) {
    const preInvestmentSnapshot = preInvestmentSnapshots[index]
    const postInvestmentSnapshot = postInvestmentSnapshots[index]
    if (preInvestmentSnapshot && postInvestmentSnapshot) {
      const tokenAmount = preInvestmentSnapshot.tokenAmount - postInvestmentSnapshot.tokenAmount
      //Not exact, but close enough.
      const usdAmount = tokenAmount * postInvestmentSnapshot.price
      inputTxAssetAmountInfo.push({
        assetId: asset.id,
        tokenAmount: Math.abs(tokenAmount).toString(),
        usdAmount: Math.abs(usdAmount).toString(),
      });
    } else {
      //Should never happen.
      console.log(`No snapshot pair was found for input asset ${asset.name}`);
    }
    index++
  }
  return inputTxAssetAmountInfo;
}

async function captureAssetSnapshots(opportunity: OpportunityData, userAddress: string) {
  let inputAssetSnapshot: UserFungibleTokenBalanceInfo[] = []
  let outputAssetSnapshot: UserFungibleTokenBalanceInfo[] = []
  //Capture input token(s) snapshots(s)
  for (const inputAsset of opportunity.inputAssets) {
    console.log("inputAsset", inputAsset);
    if (inputAsset.type === "ERC20" || inputAsset.type === "NATIVE") {
      inputAssetSnapshot.push(await _getUserFungibleTokenBalanceInfo(userAddress, opportunity, inputAsset));
    } else {
      //Need different approach for NFTs
    }
  }

  //Capture output token(s) snapshots(s)
  for (const outputAsset of opportunity.outputAssets) {
    if (outputAsset.type === "ERC20" || outputAsset.type === "NATIVE") {
      outputAssetSnapshot.push(await _getUserFungibleTokenBalanceInfo(userAddress, opportunity, outputAsset));
    } else {
      //Need different approach for NFTs
    }
  }
  return {
    inputAssetSnapshot,
    outputAssetSnapshot,
  }
}

export async function createTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  inputAmounts: TokenInput[],
  type: TransactionType,
  extraData: any[] = [],
  privyClient: PrivyClient
) {
  console.log("createTransaction");
  console.log(`opportunity: ${JSON.stringify(opportunity)}`);
  console.log(`userAddress: ${userAddress}`);
  console.log(`inputAmounts: ${JSON.stringify(inputAmounts)}`);
  console.log(`type: ${type}`);
  console.log(`extraData: ${JSON.stringify(extraData)}`);

  let inputAssetMovementInfo: TxAssetAmountInfo[] = [];
  let outputAssetMovementInfo: TxAssetAmountInfo[] = [];

  let preTransactionInputAssetSnapshots: UserFungibleTokenBalanceInfo[] = []
  let postTransactionInputAssetSnapshots: UserFungibleTokenBalanceInfo[] = []

  let preTransactionOutputAssetSnapshots: UserFungibleTokenBalanceInfo[] = []
  let postTransactionOutputAssetSnapshots: UserFungibleTokenBalanceInfo[] = []

  //make this live longer, no need to remake it every time.
  const serverSideTransactions = new ServerSideTransactions(privyClient);
  let txs: any[] = [];
  if (type === TransactionType.Invest) {
    //CrosschainSwap
    opportunity.supportsAutoSwap && await performCrossChainSwap(serverSideTransactions, opportunity, userAddress, inputAmounts);

    const preInvestmentAssetSnapshots = await captureAssetSnapshots(opportunity, userAddress);
    preTransactionInputAssetSnapshots = preInvestmentAssetSnapshots.inputAssetSnapshot;
    preTransactionOutputAssetSnapshots = preInvestmentAssetSnapshots.outputAssetSnapshot;


    switch (opportunity.id) {
      case "1":
        let tx = await createLidoSubmitTransaction(
          opportunity,
          userAddress,
          inputAmounts,
        );
        txs.push(tx);
        break;
      case "2":
        let approvalTxs = await createDualTokenApprovalTransactions(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let mintTx = await createUniswapMintLPTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          approvalTxs.length,
          extraData,
        );
        txs.push(...approvalTxs, mintTx);
        break;
      case "3":
      case "4":
        let aaveSupplyApprovalTx = await createAaveV3SupplyApprovalTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          0,
        );
        let aaveSupplyTx = await createAaveV3SupplyTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          1,
        );
        txs.push(aaveSupplyApprovalTx, aaveSupplyTx);
        break;
      case "5":
        let approvalTxs5 = await createDualTokenApprovalTransactions(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let mintTx5 = await createUniswapMintLPTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          approvalTxs5.length,
          extraData,
        );
        txs.push(...approvalTxs5, mintTx5);
        break;
      case "8":
      case "9":
      case "10":
      case "11":
      case "12":
      case "13":
      case "14":
      case "15":
      case "16":
      case "17":
      case "18":
      case "19":
      case "20":
      case "21":
      case "22":
      case "23":
      case "24":
      case "25":
      case "26":
      case "6":
        let approvalTxs6 = await createDualTokenApprovalTransactions(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let mintTx6 = await createKodiakIslandMintTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          approvalTxs6.length,
          extraData,
        );
        txs.push(...approvalTxs6, mintTx6);
        break;
      case "7":
        let approvalTx7 = await createInfraredStakeApprovalTransaction(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let stakeTx7 = await createInfraredStakeTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          1
        );
        txs.push(approvalTx7, stakeTx7);
    }
  } else if (type === TransactionType.Divest) {
    const preInvestmentAssetSnapshots = await captureAssetSnapshots(opportunity, userAddress);
    preTransactionInputAssetSnapshots = preInvestmentAssetSnapshots.inputAssetSnapshot;
    preTransactionOutputAssetSnapshots = preInvestmentAssetSnapshots.outputAssetSnapshot;
    switch (opportunity.id) {
      case "1":
        let tx = await createLidoWithdrawalTransaction(
          opportunity,
          userAddress,
          extraData,
        );
        txs.push(tx);
        break;
      case "2":
        let totalRedeemTxs = await createRedeemTotalUniswapLPTransactions(
          opportunity,
          userAddress,
          0,
          extraData,
        );
        txs.push(...totalRedeemTxs);
        break;
      case "3":
      case "4":
        let aaveWithdrawTx = await createAaveV3WithdrawTransaction(
          opportunity,
          userAddress,
          inputAmounts,
        );
        txs.push(aaveWithdrawTx);
        break;
      case "5":
        let totalRedeemTxs5 = await createRedeemTotalUniswapLPTransactions(
          opportunity,
          userAddress,
          0,
          extraData,
        );
        txs.push(...totalRedeemTxs5);
        break;
      case "8":
      case "9":
      case "10":
      case "11":
      case "12":
      case "13":
      case "14":
      case "15":
      case "16":
      case "17":
      case "18":
      case "19":
      case "20":
      case "21":
      case "22":
      case "23":
      case "24":
      case "25":
      case "26":
      case "6":
        let approvalTx6 = await createKodiakIslandApprovalTransaction(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let redeemTx6 = await createKodiakIslandRedeemTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          1,
          extraData,
        );
        txs.push(approvalTx6, redeemTx6);
        break;
      case "7":
        const infraredWithdrawalTx = await createInfraredWithdrawalTransaction(
          opportunity,
          userAddress,
          inputAmounts
        );
        txs.push(infraredWithdrawalTx);
        break;
    }
  } else if (type === TransactionType.RequestDivest) {
    switch (opportunity.id) {
      case "1":
        let tx1 = await createLidoRequestWithdrawalApprovalTransaction(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let tx2 = await createLidoRequestWithdrawalTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          1,
        );
        txs.push(tx1, tx2);
    }
  } else if (type === TransactionType.CollectRewards) {
    //This is mostly for uniswap v3 positions, need to do something here when we decide to calculate PNL for this.
    switch (opportunity.id) {
      case "2":
        let collectRewardsTx = await createCollectRewardsTransaction(
          opportunity,
          userAddress,
          0,
          extraData,
        );
        txs.push(collectRewardsTx);
        break;
      case "5":
        let collectRewardsTx5 = await createCollectRewardsTransaction(
          opportunity,
          userAddress,
          0,
          extraData,
        );
        txs.push(collectRewardsTx5);
        break;
      case "7":
        const infraredCollectRewardsTx = await createInfraredCollectRewardsTransaction(
          opportunity,
          userAddress,
          inputAmounts
        );
        txs.push(infraredCollectRewardsTx);
        break;
    }
  } else {
    throw new Error("Invalid transaction type");
  }

  if (txs.length === 0) {
    throw new Error("Could not match parameters to a transaction");
  } else {
    console.log("Finished creating transactions, attempting to send.");

    const txHashes = await serverSideTransactions.sendTransactions(
      opportunity.chain,
      userAddress,
      txs,
    );
    //Wait a bit for transactions to be extra confirmed.
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    if (type == TransactionType.Invest || type == TransactionType.Divest) {//While we work on other types, we can just use this. 
      const postTransactionAssetSnapshots = await captureAssetSnapshots(opportunity, userAddress);
      postTransactionInputAssetSnapshots = postTransactionAssetSnapshots.inputAssetSnapshot;
      postTransactionOutputAssetSnapshots = postTransactionAssetSnapshots.outputAssetSnapshot;

      //console.log("preInvestmentInputSnapshots", preTransactionInputAssetSnapshots);
      //console.log("postInvestmentInputSnapshots", postTransactionInputAssetSnapshots);
      //console.log("preInvestmentOutputSnapshots", preTransactionOutputAssetSnapshots);
      //console.log("postInvestmentOutputSnapshots", postTransactionOutputAssetSnapshots);

      inputAssetMovementInfo = await generateTxAssetAmountInfo(preTransactionInputAssetSnapshots, postTransactionInputAssetSnapshots, opportunity.inputAssets);
      outputAssetMovementInfo = await generateTxAssetAmountInfo(preTransactionOutputAssetSnapshots, postTransactionOutputAssetSnapshots, opportunity.outputAssets);
    }
    return {
      inputTxAssetAmountInfo: inputAssetMovementInfo,
      outputTxAssetAmountInfo: outputAssetMovementInfo,
      txHashes,
    };
  }
}



export async function getWithdrawalStatus(
  opportunity: OpportunityData,
  userAddress: string,
) {
  let result: any = null;
  switch (opportunity.id) {
    case "1":
      result = await getLidoWithdrawalRequests(opportunity, userAddress);
      break;
    case "2":
      result = await getUniswapLPPositions(opportunity, userAddress);
      console.log(result);
      break;
    case "5":
      result = await getUniswapLPPositions(opportunity, userAddress);
      console.log(result);
      break;
  }
  //TODO: add uniswap position info here.

  if (!result) {
    throw new Error(
      `could not retrieve withdrawal status for opportunity ${opportunity.id} and user ${userAddress}`,
    );
  }

  return result;
}

export async function getInvestmentInfo(
  opportunity: OpportunityData,
  userAddress: string,
) {
  let result: any = null;
  switch (opportunity.protocol) {
    case "Uniswap":
      result = await getUniswapLPInfo(opportunity, userAddress);
      break;
    case "Kodiak":
      if (opportunity.type === "LP") {
        result = await getUniswapLPInfo(opportunity, userAddress);
        break;
      }
  }
  return result;
}

