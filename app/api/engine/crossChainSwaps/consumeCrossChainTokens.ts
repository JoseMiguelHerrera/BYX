import { Address, parseUnits } from "viem";
import ServerSideTransactions from "../serverSideTransactions";
import { getTokenConsumption, TokenConsumption } from "../tokenConsumptionEngine";
import { PrivyRelayLinkAdaptor } from "./privyRelayLinkAdaptor";
import { getViemChainByInternalId } from "../chainPicker";
import { OpportunityData, TokenInput } from "../../dataModels";

async function consumeCrossChainTokensToTargetChain(serverSideTransactions: ServerSideTransactions,userAddress: string,crossChainTokenConsumptions: TokenConsumption[], toChainId: string,toCurrency: string) {
    const toChain = getViemChainByInternalId(toChainId);
    for(const tokenConsumption of crossChainTokenConsumptions){ 
        if(!tokenConsumption.isInputToken){
            console.log(`Attempting swap ${tokenConsumption.tokenAmount} of token ${tokenConsumption.tokenAddress} from ${tokenConsumption.tokenChainNumber} to chain${toChain.id} for ${toCurrency} on chain ${toChain}`)
            const privyRelayLink = new PrivyRelayLinkAdaptor(serverSideTransactions.client, tokenConsumption.tokenChainNumber, userAddress)
            const weiAmount = parseUnits(tokenConsumption.tokenAmount.toString(), tokenConsumption.tokenDecimals);
    
            const result = await privyRelayLink.executeSwap(tokenConsumption.tokenChainNumber, toChain.id, tokenConsumption.tokenAddress, toCurrency, weiAmount.toString(), userAddress)
            console.log("relay linkresult", JSON.stringify(result))
        }
    }
  }

  export async function performCrossChainSwap(
    serverSideTransactions: ServerSideTransactions,
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
  ){
    const crossChainTokenConsumptions = await getTokenConsumption(opportunity, userAddress, tokenInputs);
    if(crossChainTokenConsumptions.length>0){
      //Perform cross chain consumption.
      await consumeCrossChainTokensToTargetChain(serverSideTransactions,userAddress,crossChainTokenConsumptions,opportunity.chain, tokenInputs[0]!.asset.type==="NATIVE"? "0x0000000000000000000000000000000000000000" as Address: tokenInputs[0]!.asset.address as Address);
    }
  }