import { createLidoSubmitTransaction } from "./lido/lido";
import { OpportunityData, TokenInput} from "../mockDB";

export async function createTransaction(opportunity: OpportunityData, userAddress: string, inputAmounts: TokenInput[]) {
    switch(opportunity.id) {
        case '1':
            return createLidoSubmitTransaction(opportunity.contractAddress, userAddress, inputAmounts, opportunity.chain);
    }
    throw new Error('Invalid opportunity');
}