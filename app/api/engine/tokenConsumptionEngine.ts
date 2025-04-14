import { OpportunityData, TokenInput } from "../dataModels";
import { DebankTokenInfo, getBalancesFromDebank } from "../balances/route";
import { Address } from "viem";
import { getAssetBySymbolAndChain} from "@/database/queries";
import { getViemChainByInternalId } from "./chainPicker";


//This is super hacky: native asset gas usage in dollars.
export function getUSDGasBuffer(chainId: string, transactionIndex: number): number {
    switch (chainId) {
      case "arbitrum":
        return 1*(1+transactionIndex);
      case "ethereum":
        return 4*(1+transactionIndex);
      case "berachain":
        return 1*(1+transactionIndex);
      case "base":
        return 1*(1+transactionIndex);;
    }
    throw new Error("Invalid chain");
  }

//Can expand this of course to do more complex prioritization.
export async function prioritizeDebankBalances(debankBalances: DebankTokenInfo[]): Promise<DebankTokenInfo[]> {
    const prioritizedBalances: DebankTokenInfo[] = [];
    const nativeAssets: DebankTokenInfo[] = [];
    // Separate native and non-native assets
    for (const balance of debankBalances) {
        if (balance.isNativeAsset) {
            nativeAssets.push(balance);
        } else {
            prioritizedBalances.push(balance);
        }
    }
    // Combine arrays with native assets at the end
    return [...prioritizedBalances, ...nativeAssets];
}

//This should only be called if canPerformNativeAssetConsumption returns false
export async function getTokenConsumptionInfo(debankBalances: DebankTokenInfo[],opportunity: OpportunityData, tokenInputs: TokenInput[], tokenInputIndex: number) {
    const gasBufferedDebankBalances = await getGasBufferedDebankBalances(debankBalances,tokenInputIndex);
    const tokenConsumptions = await getMultiTokenConsumption(gasBufferedDebankBalances,debankBalances,opportunity, tokenInputs,tokenInputIndex);
    console.log("tokenConsumptions", tokenConsumptions);
    return tokenConsumptions;
}

export async function canPerformNativeAssetConsumption(debankBalances: DebankTokenInfo[],opportunity: OpportunityData, tokenInputs: TokenInput[]): Promise<boolean> {    
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

async function getGasBufferedDebankBalances(debankBalances: DebankTokenInfo[],tokenInputIndex: number): Promise<DebankTokenInfo[]> {
      // Replace the map with a for...of loop to handle async operations
      const gasBufferedDebankBalances: DebankTokenInfo[] = [];
      for (const balance of debankBalances) {
          const assetInfo = await getAssetBySymbolAndChain(balance.symbol, balance.chain.toLowerCase());
          if(assetInfo?.tokenType!=="NATIVE"){//Not a native asset.
            gasBufferedDebankBalances.push(balance);
            continue;
          }
          const gasUSDBuffer = getUSDGasBuffer(balance.chain.toLowerCase(),tokenInputIndex);
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
//TODO: This needs to be reworked.... we SHOULD be able to consume one of the input tokens to swap for the other one, but only to a certain extent... cannot go below a certain amount. 
async function getMultiTokenConsumption(gasBufferedDebankBalances: DebankTokenInfo[], rawDebankBalances: DebankTokenInfo[], opportunity: OpportunityData, inputTokens: TokenInput[], inputTokenIndex: number): Promise<TokenConsumption[]> {
    const inputToken = inputTokens[inputTokenIndex]!;
    console.log("gasBufferedDebankBalances", gasBufferedDebankBalances);
    console.log(opportunity.chain)
    console.log(inputToken.asset.symbol)
    const inputTokenBalanceInfo = gasBufferedDebankBalances.find(
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

    for (const gasBufferedDebankBalance of gasBufferedDebankBalances) {
        // Break if we've already reached our target
        if (remainingUsdToFund <= 0) {
            break;
        }
        
        // Skip token if it has no value
        if (gasBufferedDebankBalance.usdValue <= 0) {
            continue; // Skip to next iteration
        }
        const assetInfo = await getAssetBySymbolAndChain(gasBufferedDebankBalance.symbol, gasBufferedDebankBalance.chain.toLowerCase());
        const chainInfo = getViemChainByInternalId(gasBufferedDebankBalance.chain.toLowerCase());
        if(!assetInfo){
            //This should never happen.
            console.log(gasBufferedDebankBalance);
            throw new Error("Asset info not found in db");
        }
        // Determine whether to use all or part of this token
        let debankBalanceIndex =0;
        if (gasBufferedDebankBalance.usdValue <= remainingUsdToFund) {

            const isInputToken= inputTokens.some(inputToken => inputToken.asset.symbol.toLowerCase() === gasBufferedDebankBalance.symbol.toLowerCase() && opportunity.chain.toLowerCase() === gasBufferedDebankBalance.chain.toLowerCase());

            tokenConsumptions.push({
                tokenSymbol: gasBufferedDebankBalance.symbol,
                tokenAddress: assetInfo.address && assetInfo.tokenType!=="NATIVE" ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                tokenAmount: gasBufferedDebankBalance.balance,
                tokenDebankPrice: gasBufferedDebankBalance.price,
                tokenDebankUSDValue: gasBufferedDebankBalance.usdValue,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: isInputToken,
                isNativeAsset: assetInfo.tokenType==="NATIVE"
            });
            remainingUsdToFund -= gasBufferedDebankBalance.usdValue;
            rawDebankBalances[debankBalanceIndex]!.usdValue-=gasBufferedDebankBalance.usdValue;
            rawDebankBalances[debankBalanceIndex]!.balance=(parseFloat(rawDebankBalances[debankBalanceIndex]!.balance) -parseFloat(gasBufferedDebankBalance.balance)).toString();        
        } else {
            //Debank usd value of this asset is greater than the remaining usd to fund.
            const isInputToken= inputTokens.some(inputToken => inputToken.asset.symbol.toLowerCase() === gasBufferedDebankBalance.symbol.toLowerCase() && opportunity.chain.toLowerCase() === gasBufferedDebankBalance.chain.toLowerCase());

            // Only use a portion of this token
            const fraction = remainingUsdToFund / gasBufferedDebankBalance.usdValue;
            const tokenAmount = parseFloat(gasBufferedDebankBalance.balance) * fraction;
            const usdFraction = gasBufferedDebankBalance.usdValue * fraction;
            tokenConsumptions.push({
                tokenSymbol: gasBufferedDebankBalance.symbol,
                tokenAddress: assetInfo.address ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                tokenAmount: tokenAmount.toString(),
                tokenDebankPrice: gasBufferedDebankBalance.price,
                tokenDebankUSDValue: usdFraction,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: isInputToken,
                isNativeAsset: assetInfo.address===null
            });
            remainingUsdToFund -= usdFraction;
            rawDebankBalances[debankBalanceIndex]!.usdValue-=usdFraction;
            rawDebankBalances[debankBalanceIndex]!.balance=(parseFloat(rawDebankBalances[debankBalanceIndex]!.balance) -tokenAmount).toString();
        }
        debankBalanceIndex++;
    }
    
    // Check if we couldn't gather enough funds
    if (remainingUsdToFund > 0) {
        console.log(tokenConsumptions);
        throw new Error(`Insufficient funds. Still need $${remainingUsdToFund.toFixed(2)} more.`);
    }
    
    return tokenConsumptions;
}


