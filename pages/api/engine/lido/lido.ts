import { lidoSubmitABI, lidoRequestWithdrawalABI, erc20ABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import { Address, createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { TokenInput, OpportunityData } from "../../mockDB";
import { genericValidate } from "../validateInputAssets";

export async function createLidoSubmitTransaction(opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[], nonceOffSet: number = 0) {

  await validateInvest(opportunity, tokenInputs);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce = (await client.getTransactionCount({ address: userAddress as Address })) + nonceOffSet;

  const data = encodeFunctionData({
    abi: lidoSubmitABI,
    functionName: 'submit',
    args: ['0x0000000000000000000000000000000000000000'], // No referral
  });

  const contractAddress = opportunity.contracts.find(contract => contract.type === 'invest')?.contractAddress;

  if (!contractAddress) {
    throw new Error('Invalid contract address');
  }

  const gasEstimate = await client.estimateGas({
    account: userAddress as Address,
    to: contractAddress as Address,
    value: parseEther(tokenInputs[0]!.amount),
    data
  })

  const val = parseEther(tokenInputs[0]!.amount);

  const transaction = {
    chainId: viemChain.id,
    to: contractAddress,
    value: `0x${val.toString(16)}`,
    gas: gasEstimate.toString(),
    nonce,
    data
  }


  return {transaction, wait:client.waitForTransactionReceipt}
}

export async function createLidoRequestWithdrawalApprovalTransaction(opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[], nonceOffSet: number = 0) {
  //TODO: validation
  console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);

  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce = (await client.getTransactionCount({ address: userAddress as Address })) + nonceOffSet;


  const outputAssetAddress = opportunity.outputAssets[0]?.address;
  const contractAddress = opportunity.contracts.find(contract => contract.type === 'divest')?.contractAddress;
  if (!contractAddress || !outputAssetAddress) {
    throw new Error('Invalid contract addresses');
  }

  const val = parseEther(tokenInputs[0]!.amount);

  const data = encodeFunctionData({
    abi: erc20ABI,
    functionName: 'approve',
    args: [contractAddress as Address, val],
  })

  const gasEstimate = await client.estimateGas({
    account: userAddress as Address,
    to: outputAssetAddress as Address,
    value: BigInt(0),
    data
  })

  const transaction = {
    chainId: viemChain.id,
    to: outputAssetAddress,
    value: `0x${BigInt(0).toString(16)}`,
    gas: gasEstimate.toString(),
    nonce,
    data
  }

  return {transaction, wait:client.waitForTransactionReceipt}

}

export async function createLidoRequestWithdrawalTransaction(opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[], nonceOffSet: number = 0) {

  //await validateInvest(opportunity, tokenInputs);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce = (await client.getTransactionCount({ address: userAddress as Address })) + nonceOffSet;

  const contractAddress = opportunity.contracts.find(contract => contract.type === 'divest')?.contractAddress;

  if (!contractAddress) {
    throw new Error('Invalid contract address');
  }

  const val = parseEther(tokenInputs[0]!.amount);

  const data = encodeFunctionData({
    abi: lidoRequestWithdrawalABI,
    functionName: 'requestWithdrawals',
    args: [[val], userAddress], // No referral
  });

  const gasEstimate = await client.estimateGas({
    account: userAddress as Address,
    to: contractAddress as Address,
    value: BigInt(0),
    data
  })

  const transaction = {
    chainId: viemChain.id,
    to: contractAddress,
    value: `0x${BigInt(0).toString(16)}`,
    gas: gasEstimate.toString(),
    nonce,
    data
  }

  return {transaction, wait:client.waitForTransactionReceipt}

}


async function validateInvest(opportunity: OpportunityData, tokenInputs: TokenInput[]) {
  //Lido-specific validation
  if (tokenInputs.length !== 1) {
    throw new Error('Invalid token inputs (lido requires 1 input asset)');
  }
  const tokenInput = tokenInputs[0];
  if (!tokenInput) {
    throw new Error('Invalid token input (null)');
  }

  if (Number(tokenInput.amount) === 0) {
    throw new Error('Invalid token inputs (amount - 0)');
  }

  //Generic validation
  await genericValidate(opportunity, tokenInputs);
}