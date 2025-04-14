import { Address, parseUnits } from "viem";
import ServerSideTransactions from "../serverSideTransactions";
import { canPerformNativeAssetConsumption, getTokenConsumptionInfo, prioritizeDebankBalances, TokenConsumption } from "../tokenConsumptionEngine";
import { PrivyRelayLinkAdaptor } from "./privyRelayLinkAdaptor";
import { getViemChainByInternalId } from "../chainPicker";
import { OpportunityData, TokenInput } from "../../dataModels";
import { getTokenInfo } from "@/libs/debank";
import { getChainById } from "@/database/queries";
import { getBalancesFromDebank } from "../../balances/route";

async function consumeCrossChainTokensToTargetChain(serverSideTransactions: ServerSideTransactions, userAddress: string, crossChainTokenConsumptions: TokenConsumption[], toChainId: string, toCurrency: string, toCurrencyPrice: number, toCurrencyDecimals: number) {
  const toChain = getViemChainByInternalId(toChainId);
  for (const tokenConsumption of crossChainTokenConsumptions) {
    //TODO: This is a hack to prevent swapping back and forth between the input tokens.
    //However, I should be able to swap one of the input tokens for the other, to a certain extent.
    if (!tokenConsumption.isInputToken) {
      console.log(`Attempting swap ${tokenConsumption.tokenAmount} of token ${tokenConsumption.tokenAddress} from ${tokenConsumption.tokenChainNumber} to chain${toChain.id} for ${toCurrency} on chain ${toChain.id}`)
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

export async function performCrossChainSwap(
  serverSideTransactions: ServerSideTransactions,
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[]
) {
  let debankBalancesRaw = await getBalancesFromDebank(userAddress as Address);
  let debankBalances = await prioritizeDebankBalances(debankBalancesRaw);
  const canConsumeNativeAssets = await canPerformNativeAssetConsumption(debankBalances, opportunity, tokenInputs);

  if (!canConsumeNativeAssets) {
    console.log("Not enough native assets to perform consumption. Preparing for cross chain swaps.")
    let tokenInputIndex=0;
    for (const tokenInput of tokenInputs) {
      //Note the getTokenConsumptionInfo modifies the debankBalances array to remove the tokens that have been consumed.
      const crossChainTokenConsumptions = await getTokenConsumptionInfo(debankBalances, opportunity, tokenInputs,tokenInputIndex);
      const chainInfo = await getChainById(opportunity.chain);
      //Like in getBalancesFromDebank, this is a hack because debank uses native asset address equal to the chain name.
      const toCurrencyInfo = await getTokenInfo(chainInfo?.debankName as string, tokenInputs[0]!.asset.address ? tokenInputs[0]!.asset.address as Address : chainInfo?.debankName as string);
      const toCurrencyPrice = toCurrencyInfo.price;
      const toCurrencyDecimals = toCurrencyInfo.decimals;
      if (crossChainTokenConsumptions.length > 0) {
        //Perform cross chain consumption.
        await consumeCrossChainTokensToTargetChain(serverSideTransactions, userAddress, crossChainTokenConsumptions, opportunity.chain, tokenInputs[0]!.asset.type === "NATIVE" ? "0x0000000000000000000000000000000000000000" as Address : tokenInputs[0]!.asset.address as Address, toCurrencyPrice, toCurrencyDecimals);
      }
      tokenInputIndex++;
    }
  }else{
    console.log("Enough native assets to not require cross chain swaps.")
  }
}