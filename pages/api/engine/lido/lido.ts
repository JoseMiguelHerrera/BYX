import { lidoABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import { Address, createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { TokenInput } from "../../mockDB";

export async function createLidoSubmitTransaction(lidoContractAddress: string, userAddress: string, tokenInputs: TokenInput[], chainId: string) {
  //token validatin
  if (tokenInputs.length !== 1) {
    throw new Error('Invalid token inputs (length)');
  }
  const tokenInput = tokenInputs[0];
  if (!tokenInput) {
    throw new Error('Invalid token inputs (null)');
  }
  if (!tokenInput.asset.isNative) {
    throw new Error('Invalid token inputs (not native)');
  }

  const viemChain = getViemChain(chainId);
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
    to: lidoContractAddress as Address,
    value: parseEther(tokenInput.amount),
    data
  })

  //const maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas()

  const val=parseEther(tokenInput.amount);
  console.log(val);

  const transaction = {
    chainId: viemChain.id,
    to: lidoContractAddress,
    value: `0x${val.toString(16)}`,
   // maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    gas: gasEstimate.toString(),
    nonce,
    data
  }


  console.log(transaction);

  return transaction;
}


///add a verifiy function here like so https://viem.sh/docs/utilities/verifyTypedData.html