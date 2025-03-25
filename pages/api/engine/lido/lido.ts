import { lidoSubmitABI, lidoRequestWithdrawalABI, erc20ABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import {
  Address,
  createPublicClient,
  http,
  encodeFunctionData,
  formatEther,
  parseEther,
  decodeFunctionResult,
} from "viem";
import { TokenInput, OpportunityData, RedeemStatus } from "../../dataModels";
import { genericValidateTokenInputs } from "../validateAssets";
import { createErc20ApprovalTransaction } from "../generic/approveErc20Token";

export async function createLidoSubmitTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
) {
  await validateInvest(opportunity, tokenInputs);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce =
    (await client.getTransactionCount({ address: userAddress as Address })) +
    nonceOffSet;

  const data = encodeFunctionData({
    abi: lidoSubmitABI,
    functionName: "submit",
    args: ["0x0000000000000000000000000000000000000000"], // No referral
  });

  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "invest",
  )?.contractAddress;

  if (!contractAddress) {
    throw new Error("Invalid contract address");
  }

  const val = parseEther(tokenInputs[0]!.amount);

  const transaction = {
    chainId: viemChain.id,
    to: contractAddress,
    value: `0x${val.toString(16)}`,
    nonce,
    data,
  };

  return { transaction, wait: client.waitForTransactionReceipt };
}

export async function createLidoRequestWithdrawalApprovalTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
) {
  await genericValidateTokenInputs(opportunity, tokenInputs, "REDEEM");
  console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);

  const outputAssetAddress = opportunity.outputAssets[0]?.address;
  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "divest",
  )?.contractAddress;
  if (!contractAddress || !outputAssetAddress) {
    throw new Error("Invalid contract addresses");
  }

  const erc20ApprovalTx = await createErc20ApprovalTransaction(
    userAddress,
    opportunity.chain,
    tokenInputs[0]!,
    contractAddress as Address,
    nonceOffSet,
  );
  return erc20ApprovalTx;
}

export async function createLidoRequestWithdrawalTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
) {
  await validateRequestWithdraw(opportunity, tokenInputs);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce =
    (await client.getTransactionCount({ address: userAddress as Address })) +
    nonceOffSet;

  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "divest",
  )?.contractAddress;

  if (!contractAddress) {
    throw new Error("Invalid contract address");
  }

  const val = parseEther(tokenInputs[0]!.amount);

  const data = encodeFunctionData({
    abi: lidoRequestWithdrawalABI,
    functionName: "requestWithdrawals",
    args: [[val], userAddress], // No referral
  });

  const transaction = {
    chainId: viemChain.id,
    to: contractAddress,
    value: `0x${BigInt(0).toString(16)}`,
    nonce,
    data,
  };

  return { transaction, wait: client.waitForTransactionReceipt };
}

export async function createLidoWithdrawalTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  extraData: any[],
  nonceOffSet: number = 0,
) {
  await validateWithdraw(extraData);
  const requestId = extraData[0];
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce =
    (await client.getTransactionCount({ address: userAddress as Address })) +
    nonceOffSet;

  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "divest",
  )?.contractAddress;

  if (!contractAddress) {
    throw new Error("Invalid contract address");
  }

  const data = encodeFunctionData({
    abi: lidoRequestWithdrawalABI,
    functionName: "claimWithdrawal",
    args: [requestId],
  });

  const transaction = {
    chainId: viemChain.id,
    to: contractAddress,
    value: `0x${BigInt(0).toString(16)}`,
    nonce,
    data,
  };

  return { transaction, wait: client.waitForTransactionReceipt };
}

export async function getLidoWithdrawalRequests(
  opportunity: OpportunityData,
  userAddress: string,
): Promise<RedeemStatus[]> {
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(),
  });

  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "divest",
  )?.contractAddress;

  if (!contractAddress) {
    throw new Error("Invalid contract address");
  }

  const getWithdrawalRequestsResponse = await client.call({
    account: userAddress as Address,
    data: encodeFunctionData({
      abi: lidoRequestWithdrawalABI,
      functionName: "getWithdrawalRequests",
      args: [userAddress],
    }),
    to: contractAddress as Address,
  });

  const withdrawalRequests = decodeFunctionResult({
    abi: lidoRequestWithdrawalABI,
    functionName: "getWithdrawalRequests",
    data: getWithdrawalRequestsResponse.data!,
  }) as BigInt[];

  return getWithdrawalStatuses(
    userAddress,
    contractAddress,
    withdrawalRequests,
    client,
    opportunity,
  );
}

async function getWithdrawalStatuses(
  userAddress: string,
  contractAddress: string,
  requestIds: BigInt[],
  client: any,
  opportunity: OpportunityData,
): Promise<RedeemStatus[]> {
  const getWithdrawalStatusResponse = await client.call({
    account: userAddress as Address,
    data: encodeFunctionData({
      abi: lidoRequestWithdrawalABI,
      functionName: "getWithdrawalStatus",
      args: [requestIds],
    }),
    to: contractAddress as Address,
  });

  const withdrawalStatuses = decodeFunctionResult({
    abi: lidoRequestWithdrawalABI,
    functionName: "getWithdrawalStatus",
    data: getWithdrawalStatusResponse.data!,
  }) as Array<{
    amountOfStETH: bigint;
    amountOfShares: bigint;
    owner: string;
    timestamp: bigint;
    isFinalized: boolean;
    isClaimed: boolean;
  }>;

  return withdrawalStatuses.map((status, index) => ({
    requestId: requestIds[index]!.toString(),
    redeemedAsset: opportunity.outputAssets[0]!,
    amountRedeemed: formatEther(status.amountOfStETH),
    redeemRequestTimeStamp: parseInt(status.timestamp.toString()),
    claimableTimeStamp: 0,
    redeemable: status.isFinalized,
    redeemed: status.isClaimed,
  }));
}

async function validateInvest(
  opportunity: OpportunityData,
  tokenInputs: TokenInput[],
) {
  //Lido-specific validation
  if (tokenInputs.length !== 1) {
    throw new Error("Invalid token inputs (lido requires 1 input asset)");
  }
  const tokenInput = tokenInputs[0];
  if (!tokenInput) {
    throw new Error("Invalid token input (null)");
  }

  if (Number(tokenInput.amount) === 0) {
    throw new Error("Invalid token inputs (amount - 0)");
  }

  //Generic validation
  await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
}

async function validateRequestWithdraw(
  opportunity: OpportunityData,
  tokenInputs: TokenInput[],
) {
  //Generic validation
  await genericValidateTokenInputs(opportunity, tokenInputs, "REDEEM");
  //Lido-specific validation
  const val = parseEther(tokenInputs[0]!.amount);
  if (val < BigInt(100)) {
    throw new Error("Minimum withdraw is 100 stETH wei");
  }
  if (val > BigInt(1000000000000000000000)) {
    throw new Error("Maximum withdraw is 1000000000000000000000 stETH wei");
  }
}

async function validateWithdraw(extraData: any[]) {
  //Can add more backend validation here like if the user even has the NFT.
  if (extraData.length == 0) {
    throw new Error("Invalid data for withdraw");
  }
  try {
    BigInt(extraData[0]);
  } catch {
    throw new Error("Invalid request ID for withdraw");
  }
}
