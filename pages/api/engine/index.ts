import { createLidoSubmitTransaction } from "./lido/lido";
import { OpportunityData, TokenInput} from "../mockDB";
import ServerSideTransactions from "./serverSideTransactions";

export async function createTransaction(opportunity: OpportunityData, userAddress: string, inputAmounts: TokenInput[]) {
    //make this live longer, no need to remake it every time.
    const serverSideTransactions = new ServerSideTransactions();
    let tx:any|null = null;
    switch(opportunity.id) {
        case '1':
            tx= await createLidoSubmitTransaction(opportunity.contractAddress, userAddress, inputAmounts, opportunity.chain);
    }

    if(!tx) {
        throw new Error('Invalid opportunity');
    }
    return serverSideTransactions.sendTransaction(userAddress, tx);
}