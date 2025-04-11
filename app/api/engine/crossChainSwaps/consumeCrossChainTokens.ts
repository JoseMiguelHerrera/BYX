import { Address, parseUnits } from "viem";
import ServerSideTransactions from "../serverSideTransactions";
import { getTokenConsumptionInfo, TokenConsumption } from "../tokenConsumptionEngine";
import { PrivyRelayLinkAdaptor } from "./privyRelayLinkAdaptor";
import { getViemChainByInternalId } from "../chainPicker";
import { OpportunityData, TokenInput } from "../../dataModels";
import { getTokenInfo } from "@/libs/debank";
import { getChainById } from "@/database/queries";

async function consumeCrossChainTokensToTargetChain(serverSideTransactions: ServerSideTransactions,userAddress: string,crossChainTokenConsumptions: TokenConsumption[], toChainId: string,toCurrency: string,toCurrencyPrice: number, toCurrencyDecimals: number) {
    const toChain = getViemChainByInternalId(toChainId);
    for(const tokenConsumption of crossChainTokenConsumptions){ 
        if(!tokenConsumption.isInputToken){
            console.log(`Attempting swap ${tokenConsumption.tokenAmount} of token ${tokenConsumption.tokenAddress} from ${tokenConsumption.tokenChainNumber} to chain${toChain.id} for ${toCurrency} on chain ${toChain}`)
            const privyRelayLink = new PrivyRelayLinkAdaptor(serverSideTransactions.client, tokenConsumption.tokenChainNumber, userAddress)
            
            // Get the pre-calculated USD value directly from tokenConsumption
            const inputUsdValue = tokenConsumption.tokenDebankUSDValue;
                       
            // Calculate equivalent amount of output tokens based on USD value
            const outputTokenAmount = inputUsdValue / toCurrencyPrice;
            
            console.log(`Input USD value: $${inputUsdValue}, Output token amount: ${outputTokenAmount}`);
            
            // Convert to wei using mocked output token decimals
            const weiAmount = parseUnits(outputTokenAmount.toString(), toCurrencyDecimals);
    
            await privyRelayLink.executeSwap(tokenConsumption.tokenChainNumber, toChain.id, tokenConsumption.tokenAddress, toCurrency, weiAmount.toString(), userAddress)
        }
    }
  }

  //TODO: the multiple input token consumption should be done here.
  export async function performCrossChainSwap(
    serverSideTransactions: ServerSideTransactions,
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[]
  ){
    const crossChainTokenConsumptions = await getTokenConsumptionInfo(opportunity, userAddress, tokenInputs);
    const chainInfo = await getChainById(opportunity.chain);
    const toCurrencyInfo = await getTokenInfo(chainInfo?.debankName as string, tokenInputs[0]!.asset.address as Address);
    const toCurrencyPrice = toCurrencyInfo.price;
    const toCurrencyDecimals = toCurrencyInfo.decimals;
    if(crossChainTokenConsumptions.length>0){
      //Perform cross chain consumption.
      await consumeCrossChainTokensToTargetChain(serverSideTransactions,userAddress,crossChainTokenConsumptions,opportunity.chain, tokenInputs[0]!.asset.type==="NATIVE"? "0x0000000000000000000000000000000000000000" as Address: tokenInputs[0]!.asset.address as Address,toCurrencyPrice,toCurrencyDecimals);
    }
  }