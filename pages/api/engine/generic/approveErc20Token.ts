import { erc20ABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import {
  Address,
  createPublicClient,
  http,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { TokenInput } from "../../mockDB";

export async function createErc20ApprovalTransaction(
  userAddress: string,
  opportunityChain: string,
  assetAndAmount: TokenInput,
  spenderAddress: Address,
  nonceOffSet: number = 0,
) {
  const viemChain = getViemChain(opportunityChain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const nonce =
    (await client.getTransactionCount({ address: userAddress as Address })) +
    nonceOffSet;

  const val = parseUnits(assetAndAmount.amount, assetAndAmount.asset.decimals);

  const data = encodeFunctionData({
    abi: erc20ABI,
    functionName: "approve",
    args: [spenderAddress, val],
  });

  const transaction = {
    chainId: viemChain.id,
    to: assetAndAmount.asset.address,
    value: `0x${BigInt(0).toString(16)}`,
    nonce,
    data,
  };

  return { transaction, wait: client.waitForTransactionReceipt };
}
