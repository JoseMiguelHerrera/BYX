import { createLidoSubmitTransaction, createLidoRequestWithdrawalApprovalTransaction, createLidoRequestWithdrawalTransaction } from "./lido/lido";
import { OpportunityData, TokenInput, TransactionType} from "../mockDB";
import ServerSideTransactions from "./serverSideTransactions";

export async function createTransaction(opportunity: OpportunityData, userAddress: string, inputAmounts: TokenInput[],type: TransactionType) {
    //make this live longer, no need to remake it every time.
    const serverSideTransactions = new ServerSideTransactions();
    let txs:any[] = [];
    if(type===TransactionType.Invest){
        switch(opportunity.id) {
            case '1':
                let tx= await createLidoSubmitTransaction(opportunity, userAddress, inputAmounts);
                txs.push(tx);
        }
    }else if(type===TransactionType.Divest){
    }else if(type===TransactionType.RequestDivest){
        switch(opportunity.id) {
            case '1':
                let tx1 =await createLidoRequestWithdrawalApprovalTransaction(opportunity, userAddress, inputAmounts);
                let tx2 = await createLidoRequestWithdrawalTransaction(opportunity, userAddress, inputAmounts,1);
                txs.push(tx1,tx2);
        }
    }else{
        throw new Error('Invalid transaction type');
    }

    if(txs.length===0) {
        throw new Error('Could not match parameters to a transaction');
    }else{
        return serverSideTransactions.sendTransactions(userAddress, txs);
    }
}