import { InfraredVaultABI } from "../../abis";
import { getViemChainByInternalId } from "../chainPicker";
import {
    Address,
    createPublicClient,
    http,
    encodeFunctionData,
    formatEther,
    parseEther,
    parseUnits,
    decodeFunctionResult,
    PublicClient,
} from "viem";
import { TokenInput, OpportunityData, RedeemStatus } from "../../dataModels";
import { genericValidateTokenInputs } from "../validateAssets";
import { createErc20ApprovalTransaction } from "../generic/approveErc20Token";

export async function createInfraredStakeTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createInfraredStakeTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    await validateInfraredStake(opportunity, tokenInputs, extraData);
    const viemChain = getViemChainByInternalId(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) +
        nonceOffSet;

    const tokenStakeAmount = parseUnits(
        tokenInputs[0]?.amount as string,
        tokenInputs[0]?.asset.decimals as number,
    );

    const data = encodeFunctionData({
        abi: InfraredVaultABI,
        functionName: "stake",
        args: [tokenStakeAmount],
    });

    const investContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!investContractAddress) {
        throw new Error("Invalid contract address");
    }

    const transaction = {
        chainId: viemChain.id,
        to: investContractAddress,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
    };

    return { transaction, wait: client.waitForTransactionReceipt };
}

export async function validateInfraredStake(
    opportunity: OpportunityData,
    tokenInputs: TokenInput[],
    extraData: any[] = [],
) {
    console.log("validateInfraredStake")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    //TODO: add infrared-specific validation
    await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
}

export async function createInfraredStakeApprovalTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
) {
    const vaultContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!vaultContractAddress) {
        throw new Error("Invalid contract address");
    }
    return createErc20ApprovalTransaction(
        userAddress,
        opportunity.chain,
        tokenInputs[0]!,
        vaultContractAddress as Address,
        nonceOffSet
    )
}

export async function createInfraredWithdrawalTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createInfraredWithdrawalTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    await validateInfraredWithdrawal(opportunity, tokenInputs, extraData);
    const viemChain = getViemChainByInternalId(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) +
        nonceOffSet;

    const redeemAmount = parseUnits(
        tokenInputs[0]?.amount as string,
        tokenInputs[0]?.asset.decimals as number,
    );

    const vaultContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!vaultContractAddress) {
        throw new Error("Invalid contract address");
    }

    const data = encodeFunctionData({
        abi: InfraredVaultABI,
        functionName: "withdraw",
        args: [
            redeemAmount
        ],
    });

    const transaction = {
        chainId: viemChain.id,
        to: vaultContractAddress,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
    };

    return { transaction, wait: client.waitForTransactionReceipt };
}

export async function createInfraredCollectRewardsTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createInfraredWithdrawalTransaction")
    const viemChain = getViemChainByInternalId(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) +
        nonceOffSet;

    const vaultContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!vaultContractAddress) {
        throw new Error("Invalid contract address");
    }

    const data = encodeFunctionData({
        abi: InfraredVaultABI,
        functionName: "getReward",
        args: [],
    });

    const transaction = {
        chainId: viemChain.id,
        to: vaultContractAddress,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
    };

    return { transaction, wait: client.waitForTransactionReceipt };
}

export async function validateInfraredWithdrawal(
    opportunity: OpportunityData,
    tokenInputs: TokenInput[],
    extraData: any[] = [],
) {
    console.log("validateKodiakIslandRedeem")
    console.log(`extraData: ${JSON.stringify(extraData)}`);

    console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);
    if(tokenInputs[0]?.amount === "0") {
        throw new Error("Burn amount is 0");
    }

    //TODO: add infrared=specific validation
    await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST"); //Invest because we specify the amount of input token.
}




