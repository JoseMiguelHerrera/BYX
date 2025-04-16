import { Address, parseUnits } from "viem";
import ServerSideTransactions from "../serverSideTransactions";
import { calculateInputTokenCapacity, getGasBufferedDebankBalances, getInputTokenBufferedDebankBalances, getMultiTokenConsumption, prioritizeDebankBalances, TokenConsumption } from "../tokenConsumptionEngine";
import { PrivyRelayLinkAdaptor } from "./privyRelayLinkAdaptor";
import { getViemChainByInternalId } from "../chainPicker";
import { OpportunityData, TokenInput } from "../../dataModels";
import { getTokenInfo } from "@/libs/debank";
import { getChainById } from "@/database/queries";
import { getBalancesFromDebank } from "../../balances/route";

async function consumeCrossChainTokensToTargetChain(serverSideTransactions: ServerSideTransactions, userAddress: string, crossChainTokenConsumptions: TokenConsumption[], toChainId: string, toCurrency: string, toCurrencyPrice: number, toCurrencyDecimals: number) {
  const toChain = getViemChainByInternalId(toChainId);
  for (const tokenConsumption of crossChainTokenConsumptions) {
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

export async function performCrossChainSwap(
  serverSideTransactions: ServerSideTransactions,
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[]
) {
  let debankBalancesRaw = await getBalancesFromDebank(userAddress as Address);//Get the raw debank balances.
  console.log("debankBalancesRaw", debankBalancesRaw);
  const prioritizedDebankBalances = prioritizeDebankBalances(debankBalancesRaw, opportunity);//Prioritize the debank balances->Native assets last, for gas.
  console.log("prioritizedDebankBalances", prioritizedDebankBalances);
  const inputTokenCapacity = await calculateInputTokenCapacity(prioritizedDebankBalances, opportunity, tokenInputs);//Calculate the input token capacity.
  console.log("inputTokenCapacity", inputTokenCapacity);
  const inputTokenBufferedBalances = await getInputTokenBufferedDebankBalances(prioritizedDebankBalances, inputTokenCapacity, tokenInputs, opportunity);//Reserve the correct amounts of input tokens.
  console.log("debankBalances - after getInputTokenBufferedDebankBalances", inputTokenBufferedBalances);
  const readyDebankBalances = await getGasBufferedDebankBalances(inputTokenBufferedBalances, inputTokenCapacity.numberOfCrossChainSwapsRequired);
  console.log("readyDebankBalances (after getGasBufferedDebankBalances)", readyDebankBalances);

  let tokenInputIndex = 0;
  for (const tokenInput of tokenInputs) {
    if (!inputTokenCapacity.inputTokenConsumption[tokenInputIndex]?.requiresCrossChainSwap) {
      console.log(`Enough assets of input token ${tokenInput.asset.symbol} to not require cross chain swaps to get more.`)
    } else {
      const crossChainTokenConsumptions = await getMultiTokenConsumption(readyDebankBalances, opportunity, tokenInputs, tokenInputIndex, inputTokenCapacity);

      const chainInfo = await getChainById(opportunity.chain);
      //Like in getBalancesFromDebank, this is a hack because debank uses native asset address equal to the chain name.
      const toCurrencyInfo = await getTokenInfo(chainInfo?.debankName as string, tokenInputs[tokenInputIndex]!.asset.address ? tokenInputs[tokenInputIndex]!.asset.address as Address : chainInfo?.debankName as string);
      const toCurrencyPrice = toCurrencyInfo.price;
      const toCurrencyDecimals = toCurrencyInfo.decimals;
      if (crossChainTokenConsumptions.length > 0) {
        console.log("crossChainTokenConsumptions", crossChainTokenConsumptions);
        console.log("readyDebankBalances", readyDebankBalances);
        await consumeCrossChainTokensToTargetChain(serverSideTransactions,
          userAddress, crossChainTokenConsumptions,
          opportunity.chain,
          tokenInputs[tokenInputIndex]!.asset.type === "NATIVE" ? "0x0000000000000000000000000000000000000000" as Address : tokenInputs[tokenInputIndex]!.asset.address as Address,
          toCurrencyPrice,
          toCurrencyDecimals);
      }
    }
    tokenInputIndex++;
  }
}
