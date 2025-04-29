import { OpportunityData, TokenInput } from "../dataModels";
import { DebankTokenInfo } from "../balances/route";
import { getAssetBySymbolAndChain, getChainById } from "@/database/queries";
import { getViemChainByInternalId, InternalChainId } from "./chainPicker";
import { getTokenInfo } from "@/libs/debank";


//This is super hacky: native asset gas usage in dollars.
export function getUSDGasBuffer(chainId: string, numberOfOperations: number): number {
    switch (chainId) {
        case InternalChainId.Arbitrum:
            return 0.66 * numberOfOperations;
        case InternalChainId.Ethereum:
            return 3.50 * numberOfOperations;
        case InternalChainId.Berachain:
            return 1 * numberOfOperations;
        case InternalChainId.Base:
            return 0.66 * numberOfOperations;
    }
    throw new Error("Invalid chain");
}

export function prioritizeDebankBalances(debankBalances: DebankTokenInfo[], opportunity: OpportunityData): DebankTokenInfo[] {
    const nonNativeAssets: DebankTokenInfo[] = [];
    const nativeAssets: DebankTokenInfo[] = [];
    // Separate native and non-native assets
    for (const balance of debankBalances) {
        if (balance.isNativeAsset) {
            nativeAssets.push(balance);
        } else {
            nonNativeAssets.push(balance);
        }
    }
    // Combine arrays with native assets at the end
    return [..._prioritizeDebankBalancesByUsdValue(_prioritizeDebankBalancesByChain(nonNativeAssets, opportunity)), ..._prioritizeDebankBalancesByUsdValue(_prioritizeDebankBalancesByChain(nativeAssets, opportunity))];
}

function _prioritizeDebankBalancesByUsdValue(debankBalances: DebankTokenInfo[]): DebankTokenInfo[] {
    return debankBalances.sort((a, b) => b.usdValue - a.usdValue);
}

function _prioritizeDebankBalancesByChain(debankBalances: DebankTokenInfo[], opportunity: OpportunityData): DebankTokenInfo[] {
    // Sort the array, prioritizing balances on the opportunity's chain
    return debankBalances.sort((a, b) => {
        const aIsTargetChain = a.chain === opportunity.chain;
        const bIsTargetChain = b.chain === opportunity.chain;

        if (aIsTargetChain && !bIsTargetChain) {
            return -1; // a comes before b
        } else if (!aIsTargetChain && bIsTargetChain) {
            return 1; // b comes before a
        } else {
            return 0; // Maintain original relative order if both are target or both are not
        }
    });
}


export interface InputTokenCapacity {
    totalInputTokenUsdValue: number;
    numberOfCrossChainSwapsRequired: number;
    inputTokenConsumption: {
        symbol: string,
        chain: string,
        tokenAmount: number,
        tokenUsdValue: number,
        requiresCrossChainSwap: boolean;
    }[]
}

export async function calculateInputTokenCapacity(debankBalances: DebankTokenInfo[], opportunity: OpportunityData, tokenInputs: TokenInput[]): Promise<InputTokenCapacity> {
    const inputTokenConsumption: {
        tokenAmount: number,
        tokenUsdValue: number,
        requiresCrossChainSwap: boolean;
        symbol: string,
        chain: string,
    }[] = [];
    let totalInputTokenUsdValue = 0;
    let numberOfCrossChainSwapsRequired = 0;
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

        const requestedInputAmount = parseFloat(input.amount);
        const availableInputAmount = parseFloat(matchingTokenBalance?.balance || "0");

        if (!matchingTokenBalance) {
            //Input token is not in the debank balances, not a funding asset.
            continue;
        }

        if (availableInputAmount >= requestedInputAmount) {
            let usdValue = requestedInputAmount * matchingTokenBalance.price;
            inputTokenConsumption.push({
                tokenAmount: requestedInputAmount,
                tokenUsdValue: usdValue,
                requiresCrossChainSwap: false,
                symbol: input.asset.symbol,
                chain: opportunity.chain,
            })
            totalInputTokenUsdValue += usdValue;
        } else {
            let usdValue = availableInputAmount * matchingTokenBalance.price;
            inputTokenConsumption.push({
                tokenAmount: availableInputAmount,
                tokenUsdValue: usdValue,
                requiresCrossChainSwap: true,
                symbol: input.asset.symbol,
                chain: opportunity.chain,
            })
            totalInputTokenUsdValue += usdValue;
            numberOfCrossChainSwapsRequired++;
        }
    }

    return {
        totalInputTokenUsdValue,
        numberOfCrossChainSwapsRequired,
        inputTokenConsumption,
    };
}

export interface TokenConsumption {
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

/**
 * Buffers debank balances by reserving required amounts for input tokens
 * 
 * This function makes two important assumptions:
 * 1. The matching input tokens in debankBalances appear in the same order as in 
 *    inputTokenCapacity.inputTokenConsumption
 * 2. Each input token only appears once in debankBalances
 * 
 * These assumptions allow us to use a simple counter (inputTokenIndex) to track which
 * entry in inputTokenCapacity.inputTokenConsumption corresponds to the current token.
 */
export async function getInputTokenBufferedDebankBalances(debankBalances: DebankTokenInfo[], inputTokenCapacity: InputTokenCapacity, tokenInputs: TokenInput[], opportunity: OpportunityData): Promise<DebankTokenInfo[]> {
    const inputTokenBufferedDebankBalances: DebankTokenInfo[] = [];
    for (const balance of debankBalances) {
        const foundInputToken = tokenInputs.find((tokenInput) => tokenInput.asset.symbol.toLowerCase() === balance.symbol.toLowerCase() && opportunity.chain.toLowerCase() === balance.chain.toLowerCase());
        //No need to buffer, is not an input token.
        if (!foundInputToken) {
            inputTokenBufferedDebankBalances.push(balance);
            continue;
        }
        console.log(`dealing with found input token ${foundInputToken.asset.name}`)

        const inputTokenConsumption = inputTokenCapacity.inputTokenConsumption.find((consumption) =>
            consumption.symbol.toLowerCase() === foundInputToken.asset.symbol.toLowerCase() &&
            consumption.chain.toLowerCase() === opportunity.chain.toLowerCase());

        if (!inputTokenConsumption) {
            throw new Error("Input token consumption not found");
        }

        const currentBalance = balance.balance;
        const currentUsdValue = balance.usdValue;
        const amountToSubtract = inputTokenConsumption.tokenAmount;
        const usdToSubtract = inputTokenConsumption.tokenUsdValue;
        const parsedBalance = parseFloat(currentBalance);
        const calculatedNewBalance = parsedBalance - amountToSubtract;
        const calculatedNewUsdValue = currentUsdValue - usdToSubtract;

        inputTokenBufferedDebankBalances.push({
            ...balance,
            usdValue: calculatedNewUsdValue,
            balance: calculatedNewBalance.toString()
        });
    }
    return inputTokenBufferedDebankBalances;
}


export async function getGasBufferedDebankBalances(debankBalances: DebankTokenInfo[], operationsPerChain: Map<number, number>): Promise<DebankTokenInfo[]> {
    const gasBufferedDebankBalances: DebankTokenInfo[] = [];
    for (const balance of debankBalances) {
        const assetInfo = await getAssetBySymbolAndChain(balance.symbol, balance.chain.toLowerCase());
        if (assetInfo?.tokenType !== "NATIVE") {//Not a native asset.
            gasBufferedDebankBalances.push(balance);
            continue;
        }
        const chainNumber = getViemChainByInternalId(balance.chain.toLowerCase()).id;
        const gasUSDBuffer = getUSDGasBuffer(balance.chain.toLowerCase(), operationsPerChain.get(chainNumber) || 0);
        // Convert USD buffer to token amount based on price
        const gasTokenBuffer = balance.price > 0 ? gasUSDBuffer / balance.price : 0;

        console.log(`Token: ${balance.symbol}, gasTokenBuffer: ${gasTokenBuffer}, gasUSDBuffer: ${gasUSDBuffer}, balance.usdValue: ${balance.usdValue}`);

        if (gasUSDBuffer < balance.usdValue) {
            gasBufferedDebankBalances.push({
                ...balance,
                usdValue: balance.usdValue - gasUSDBuffer,
                balance: (parseFloat(balance.balance) - gasTokenBuffer).toString()
            });
        } else {
            gasBufferedDebankBalances.push({//To ensure no negative values
                ...balance,
                usdValue: 0,
                balance: balance.balance
            });
        }
    }
    return gasBufferedDebankBalances;
}

export function gasTokenSafetyCheck(gasBufferedDebankBalances: DebankTokenInfo[], operationsPerChain: Map<number, number>) {
    for (const balance of gasBufferedDebankBalances) {
        if (!balance.isNativeAsset) {//Not a native asset.
            continue;
        }
        const chainNumber = getViemChainByInternalId(balance.chain.toLowerCase()).id;
        const numberOfOperations = operationsPerChain.get(chainNumber);
        if (!numberOfOperations) {
            continue;
        }
        console.log(`numberOfOperations: ${numberOfOperations} on chain ${balance.chain}`);
        const gasUSDBuffer = getUSDGasBuffer(balance.chain.toLowerCase(), numberOfOperations);
        if (balance.usdValue < gasUSDBuffer) {
            const actualGasUSDValue = balance.price * parseFloat(balance.balance);
            throw new Error(`Not enough of token ${balance.symbol} on chain ${balance.chain} to cover gas costs. Need ${(gasUSDBuffer - actualGasUSDValue).toFixed(2)} more USD$ of it`);
        }
    }
}

async function getInputTokenUSDGoal(gasBufferedDebankBalances: DebankTokenInfo[], inputTokens: TokenInput[], inputTokenIndex: number, opportunity: OpportunityData, inputTokenCapacity: InputTokenCapacity) {
    const inputTokenInfo = gasBufferedDebankBalances.find(
        (balance) =>
            balance.symbol.toLowerCase() === inputTokens[inputTokenIndex]!.asset.symbol.toLowerCase() &&
            balance.chain.toLowerCase() === opportunity.chain.toLowerCase()
    );
    let inputTokenPrice;
    if (!inputTokenInfo) {
        //Input token is not a funding asset, not in the debank balances.
        console.log("gasBufferedDebankBalances", gasBufferedDebankBalances);
        //throw new Error(`Input token not found debank balances ${inputTokens[inputTokenIndex]!.asset.symbol}`);
        const chainMetadata = await getChainById(opportunity.chain);
        if (!chainMetadata) {
            throw new Error("Chain metadata not found");
        }
        let tokenIdentifier;
        if (inputTokens[inputTokenIndex]!.asset.type !== "NATIVE") {
            tokenIdentifier = inputTokens[inputTokenIndex]!.asset.address;
        } else {
            tokenIdentifier = chainMetadata.debankName
        }
        const tokenInfo = await getTokenInfo(chainMetadata.debankName, tokenIdentifier as string);
        inputTokenPrice = tokenInfo.price;
    }else{
        inputTokenPrice = inputTokenInfo.price;
    }


    const inputTokenConsumption = inputTokenCapacity.inputTokenConsumption.find((consumption) => consumption.symbol.toLowerCase() === inputTokens[inputTokenIndex]!.asset.symbol.toLowerCase());
    const inputTokenCapacityTokenAmount = inputTokenConsumption ? inputTokenConsumption.tokenAmount : 0;

    const goalUSDValue = (parseFloat(inputTokens[inputTokenIndex]!.amount) - inputTokenCapacityTokenAmount) * inputTokenPrice;

    console.log("goalUSDValue", goalUSDValue);
    return goalUSDValue;
}

export async function getMultiTokenConsumption(bufferedDebankBalances: DebankTokenInfo[], opportunity: OpportunityData, inputTokens: TokenInput[], inputTokenIndex: number, inputTokenCapacity: InputTokenCapacity): Promise<TokenConsumption[]> {
    //Goal USD value for the the current input token.
    const goalUSDValue = await getInputTokenUSDGoal(bufferedDebankBalances, inputTokens, inputTokenIndex, opportunity, inputTokenCapacity);
    console.log("goalUSDValue", goalUSDValue);

    // Define a small threshold to handle floating point inaccuracies for USD values
    const USD_PRECISION_THRESHOLD = 1e-9; // Represents a very small fraction of a cent

    let remainingUsdToFund = goalUSDValue;
    const tokenConsumptions: TokenConsumption[] = [];

    let debankBalanceIndex = 0;

    for (const bufferedDebankBalance of bufferedDebankBalances) {
        // Break if we've already reached our target (within the precision threshold)
        if (remainingUsdToFund <= USD_PRECISION_THRESHOLD) {
            remainingUsdToFund = 0; // Set to exactly 0 if below threshold
            break;
        }

        // Skip token if it has no value
        if (bufferedDebankBalance.usdValue <= 0) {
            debankBalanceIndex++;
            continue; // Skip to next iteration
        }
        const assetInfo = await getAssetBySymbolAndChain(bufferedDebankBalance.symbol, bufferedDebankBalance.chain.toLowerCase());
        const chainInfo = getViemChainByInternalId(bufferedDebankBalance.chain.toLowerCase());
        if (!assetInfo) {
            //This should never happen.
            console.log(bufferedDebankBalance);
            throw new Error("Asset info not found in db");
        }
        const isInputToken = inputTokens.some(inputToken => inputToken.asset.symbol.toLowerCase() === bufferedDebankBalance.symbol.toLowerCase() && opportunity.chain.toLowerCase() === bufferedDebankBalance.chain.toLowerCase());

        // Determine whether to use all or part of this token
        if (bufferedDebankBalance.usdValue <= remainingUsdToFund) {
            tokenConsumptions.push({
                tokenSymbol: bufferedDebankBalance.symbol,
                tokenAddress: assetInfo.address && assetInfo.tokenType !== "NATIVE" ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                tokenAmount: bufferedDebankBalance.balance,
                tokenDebankPrice: bufferedDebankBalance.price,
                tokenDebankUSDValue: bufferedDebankBalance.usdValue,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: isInputToken,
                isNativeAsset: assetInfo.tokenType === "NATIVE"
            });
            remainingUsdToFund -= bufferedDebankBalance.usdValue;

            bufferedDebankBalances[debankBalanceIndex]!.usdValue -= bufferedDebankBalance.usdValue;
            // Using original toString()
            bufferedDebankBalances[debankBalanceIndex]!.balance = (parseFloat(bufferedDebankBalances[debankBalanceIndex]!.balance) - parseFloat(bufferedDebankBalance.balance)).toString();
        } else {
            //Debank usd value of this asset is greater than the remaining usd to fund.

            // Only use a portion of this token
            const fraction = remainingUsdToFund / bufferedDebankBalance.usdValue;
            const tokenAmount = parseFloat(bufferedDebankBalance.balance) * fraction;
            const usdFraction = bufferedDebankBalance.usdValue * fraction;
            tokenConsumptions.push({
                tokenSymbol: bufferedDebankBalance.symbol,
                tokenAddress: assetInfo.address ? assetInfo.address : "0x0000000000000000000000000000000000000000",
                // Using original toString()
                tokenAmount: tokenAmount.toString(),
                tokenDebankPrice: bufferedDebankBalance.price,
                tokenDebankUSDValue: usdFraction,
                tokenDecimals: assetInfo.decimals,
                tokenChainNumber: chainInfo.id,
                isInputToken: isInputToken,
                // Using original isNativeAsset check
                isNativeAsset: assetInfo.address === null
            });
            remainingUsdToFund -= usdFraction;
            bufferedDebankBalances[debankBalanceIndex]!.usdValue -= usdFraction;
            // Using original toString()
            bufferedDebankBalances[debankBalanceIndex]!.balance = (parseFloat(bufferedDebankBalances[debankBalanceIndex]!.balance) - tokenAmount).toString();
        }
        debankBalanceIndex++;
    }

    // Check if we couldn't gather enough funds (using the threshold)
    if (remainingUsdToFund > USD_PRECISION_THRESHOLD) {
        console.log(tokenConsumptions);
        throw new Error(`Insufficient funds. Still need $${remainingUsdToFund.toFixed(2)} more.`);
    }

    return tokenConsumptions;
}


