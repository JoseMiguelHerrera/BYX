import { lidoABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import { Address, createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { TokenInput,OpportunityData } from "../../mockDB";
import { genericValidate } from "../validateInputAssets";

export async function createLidoSubmitTransaction(opportunity: OpportunityData, userAddress: string, tokenInputs: TokenInput[]) {
  await validate(opportunity, tokenInputs);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce = await client.getTransactionCount({ address: userAddress as Address });

  const data = encodeFunctionData({
    abi: lidoABI,
    functionName: 'submit',
    args: ['0x0000000000000000000000000000000000000000'], // No referral
  });

  const gasEstimate = await client.estimateGas({
    account: userAddress as Address,
    to: opportunity.contractAddress as Address,
    value: parseEther(tokenInputs[0]!.amount),
    data
  })

  const val=parseEther(tokenInputs[0]!.amount);

  const transaction = {
    chainId: viemChain.id,
    to: opportunity.contractAddress,
    value: `0x${val.toString(16)}`,
    gas: gasEstimate.toString(),
    nonce,
    data
  }

  return transaction;
}


async function validate(opportunity: OpportunityData, tokenInputs: TokenInput[]) {
  //Lido-specific validation
  if (tokenInputs.length !== 1) {
    throw new Error('Invalid token inputs (lido requires 1 input asset)');
  }
  const tokenInput = tokenInputs[0];
  if (!tokenInput) {
    throw new Error('Invalid token input (null)');
  }

  if(BigInt(tokenInput.amount) === BigInt(0)) {
    throw new Error('Invalid token inputs (amount - 0)');
  }

  //Generic validation
  await genericValidate(opportunity, tokenInputs);
}