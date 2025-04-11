import { OpportunityData, TokenInput } from "../dataModels";
import { DebankTokenInfo, getBalancesFromDebank } from "../balances/route";
import { Address } from "viem";
import { getAssetBySymbolAndChain} from "@/database/queries";
import { getViemChainByInternalId } from "./chainPicker";



export function getUSDGasBuffer(chainId: string): number {
    switch (chainId) {
      case "arbitrum":
        return 1;
      case "ethereum":
        return 5;
      case "berachain":
        return 1.50;
      case "base":
        return 1;
    }
    throw new Error("Invalid chain");
  }


export async function getTokenConsumption(opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[]) {
    const debankBalances = await getBalancesFromDebank(userAddress as Address);

    const canConsumeNativeAssets = await canPerformNativeAssetConsumption(debankBalances,opportunity, userAddress, tokenInputs);

    if (!canConsumeNativeAssets) {
        const gasBufferedDebankBalances = await getGasBufferedDebankBalances(debankBalances);
        const tokenConsumptions = await getMultiTokenConsumption(gasBufferedDebankBalances,opportunity, userAddress, tokenInputs);
        console.log("tokenConsumptions", tokenConsumptions);
       return tokenConsumptions;
    }else{
        return [];//No need to do consumption.
    }
}

async function canPerformNativeAssetConsumption(debankBalances: DebankTokenInfo[],opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[]): Promise<boolean> {
    // This returns an array with the structure:
    // { chain: string; balance: string; symbol: string; usdValue: number; }[]
    
    // Get the chain from opportunity
    const chainName = opportunity.chain;//internal chain id. Need to convert to debank chain id.
 
    // Check if user has all required tokens in sufficient amounts
    for (const input of tokenInputs) {
        // Find matching token in user's balances by symbol and chain
        const matchingTokenBalance = debankBalances.find(
            (balance) => 
                balance.symbol.toLowerCase() === input.asset.symbol.toLowerCase() && 
                balance.chain.toLowerCase() === chainName.toLowerCase()//This has some assumptions .
        );
        
        // If any token is missing or insufficient, return false
        if (!matchingTokenBalance || parseFloat(matchingTokenBalance.balance) < parseFloat(input.amount)) {
            return false;
        }
    }
    
    // All tokens are available in sufficient amounts
    return true;
}

//WIll code this for only one input token for now.

export interface TokenConsumption{
    tokenSymbol: string;
    tokenAddress: string;
    tokenAmount: string;
    tokenDebankPrice: number;
    tokenDebankUSDValue: number;
    tokenDecimals: number;
    tokenChainNumber: number;
    isInputToken: boolean;
    isNativeAsset: boolean;
}

async function getGasBufferedDebankBalances(debankBalances: DebankTokenInfo[]): Promise<DebankTokenInfo[]> {
      // Replace the map with a for...of loop to handle async operations
      const gasBufferedDebankBalances: DebankTokenInfo[] = [];
      for (const balance of debankBalances) {
          const assetInfo = await getAssetBySymbolAndChain(balance.symbol, balance.chain.toLowerCase());
          if(assetInfo?.tokenType!=="NATIVE"){//Not a native asset.
            gasBufferedDebankBalances.push(balance);
            continue;
          }
          const gasUSDBuffer = getUSDGasBuffer(balance.chain.toLowerCase());
          // Convert USD buffer to token amount based on price
          const gasTokenBuffer = balance.price > 0 ? gasUSDBuffer / balance.price : 0;
          
          console.log(`Token: ${balance.symbol}, gasTokenBuffer: ${gasTokenBuffer}, gasUSDBuffer: ${gasUSDBuffer}, balance.usdValue: ${balance.usdValue}`);

          if(gasUSDBuffer<balance.usdValue){
            gasBufferedDebankBalances.push({
                ...balance,
                usdValue: balance.usdValue - gasUSDBuffer,
                balance: (parseFloat(balance.balance) - gasTokenBuffer).toString()
            });
          }else{
            gasBufferedDebankBalances.push({//To ensure no negative values
                ...balance,
                usdValue: 0,
                balance: balance.balance
            });
          }
      }
      return gasBufferedDebankBalances;
}


//TODO: decrate debankBalances so that this can be run more than once, for the cases where there is more than one input token.
//TODO: add some cushion of native assets in each chain to account for gas.
async function getMultiTokenConsumption(debankBalances: DebankTokenInfo[],opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[]): Promise<TokenConsumption[]> {
    const inputToken = tokenInputs[0]!;
    console.log("debankBalances", debankBalances);
    console.log(opportunity.chain)
    console.log(inputToken.asset.symbol)
    const inputTokenBalanceInfo = debankBalances.find(
        (balance) => 
            balance.symbol.toLowerCase() === inputToken.asset.symbol.toLowerCase() && 
            balance.chain.toLowerCase() === opportunity.chain.toLowerCase()
    );
    console.log("inputTokenBalanceInfo", inputTokenBalanceInfo);
    if(!inputTokenBalanceInfo){
        throw new Error("Input token not found debank balances");
    }
    const inputTokenPrice = inputTokenBalanceInfo.price;
    const goalUSDValue = parseFloat(inputToken.amount) * inputTokenPrice;
    
    console.log("goalUSDValue", goalUSDValue);
    
    let remainingUsdToFund = goalUSDValue;
    const tokenConsumptions: TokenConsumption[] = [];


    for (const debankBalance of debankBalances) {
        // Break if we've already reached our target
        if (remainingUsdToFund <= 0) {
            break; // Exit the loop completely
        }
        
        // Skip token if it has no value
        if (debankBalance.usdValue <= 0) {
            continue; // Skip to next iteration
        }
        const assetInfo = await getAssetBySymbolAndChain(debankBalance.symbol, debankBalance.chain.toLowerCase());
        const chainInfo = getViemChainByInternalId(debankBalance.chain.toLowerCase());
        if(!assetInfo){
            //This should never happen.
            console.log(debankBalance);
            throw new Error("Asset info not found in db");
        }
        // Determine whether to use all or part of this token
        if (debankBalance.usdValue <= remainingUsdToFund) {
            tokenConsumptions.push({
                tokenSymbol: debankBalance.symbol,
                tokenAddress: assetInfo.address && assetInfo.tokenType!=="NATIVE" ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                tokenAmount: debankBalance.balance,
                tokenDebankPrice: debankBalance.price,
                tokenDebankUSDValue: debankBalance.usdValue,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: debankBalance.symbol.toLowerCase() === inputToken.asset.symbol.toLowerCase() && debankBalance.chain.toLowerCase() === opportunity.chain.toLowerCase(),
                isNativeAsset: assetInfo.tokenType==="NATIVE"
            });
            remainingUsdToFund -= debankBalance.usdValue;
            //Used up all of this token.
            debankBalance.usdValue=0;
            debankBalance.balance="0";        
            //console.log(`Consuming ${debankBalance.usdValue} of ${debankBalance.symbol} on chain ${debankBalance.chain}`)
        } else {
            //Debank usd value of this asset is greater than the remaining usd to fund.

            // Only use a portion of this token
            const fraction = remainingUsdToFund / debankBalance.usdValue;
            const tokenAmount = parseFloat(debankBalance.balance) * fraction;
            const usdFraction = debankBalance.usdValue * fraction;
            tokenConsumptions.push({
                tokenSymbol: debankBalance.symbol,
                tokenAddress: assetInfo.address ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                tokenAmount: tokenAmount.toString(),
                tokenDebankPrice: debankBalance.price,
                tokenDebankUSDValue: usdFraction,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: debankBalance.symbol.toLowerCase() === inputToken.asset.symbol.toLowerCase() && debankBalance.chain.toLowerCase() === opportunity.chain.toLowerCase(),
                isNativeAsset: assetInfo.address===null
            });
            remainingUsdToFund -= usdFraction;
            debankBalance.usdValue-=usdFraction;
            debankBalance.balance=(parseFloat(debankBalance.balance) -tokenAmount).toString();
        }
    }
    
    // Check if we couldn't gather enough funds
    if (remainingUsdToFund > 0) {
        console.log(tokenConsumptions);
        throw new Error(`Insufficient funds. Still need $${remainingUsdToFund.toFixed(2)} more.`);
    }
    
    return tokenConsumptions;
}


