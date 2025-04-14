import {
  createLidoSubmitTransaction,
  createLidoRequestWithdrawalApprovalTransaction,
  createLidoRequestWithdrawalTransaction,
  getLidoWithdrawalRequests,
  createLidoWithdrawalTransaction,
} from "./lido/lido";
import { OpportunityData, TokenInput, TransactionType } from "../dataModels";
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

  //make this live longer, no need to remake it every time.
  const serverSideTransactions = new ServerSideTransactions(privyClient);
  let txs: any[] = [];
  if (type === TransactionType.Invest) {
    switch (opportunity.id) {
      case "1":
        await performCrossChainSwap(serverSideTransactions,opportunity, userAddress, inputAmounts);
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
        await performCrossChainSwap(serverSideTransactions,opportunity, userAddress, inputAmounts);
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
        await performCrossChainSwap(serverSideTransactions,opportunity, userAddress, inputAmounts);
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

    return serverSideTransactions.sendTransactions(
      opportunity.chain,
      userAddress,
      txs,
    );
    //TODO: return input and output assets here.
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
      result = await getUniswapLPInfo(opportunity, userAddress);
      break;
  }
  return result;
}
