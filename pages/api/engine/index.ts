import {
  createLidoSubmitTransaction,
  createLidoRequestWithdrawalApprovalTransaction,
  createLidoRequestWithdrawalTransaction,
  getLidoWithdrawalRequests,
  createLidoWithdrawalTransaction,
} from "./lido/lido";
import { OpportunityData, TokenInput, TransactionType } from "../mockDB";
import ServerSideTransactions from "./serverSideTransactions";
import {
  createUniswapInvestApprovalTransactions,
  createUniswapMintLPTransaction,
  getUniswapLPInfo,
} from "./uniswap/uniswap";

export async function createTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  inputAmounts: TokenInput[],
  type: TransactionType,
  extraData: any[] = [],
) {
  console.log(opportunity, userAddress, inputAmounts, type, extraData);

  //make this live longer, no need to remake it every time.
  const serverSideTransactions = new ServerSideTransactions();
  let txs: any[] = [];
  if (type === TransactionType.Invest) {
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
        let approvalTxs = await createUniswapInvestApprovalTransactions(
          opportunity,
          userAddress,
          inputAmounts,
        );
        let mintTx = await createUniswapMintLPTransaction(
          opportunity,
          userAddress,
          inputAmounts,
          approvalTxs.length,
          extraData
        );
        txs.push(...approvalTxs, mintTx);
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
  }

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
  }
  return result;
}

