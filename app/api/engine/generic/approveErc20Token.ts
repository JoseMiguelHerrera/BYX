import { erc20ABI } from "../../abis";
import { getViemChainByInternalId } from "../chainPicker";
import {
  Address,
  createPublicClient,
  http,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { OpportunityData, TokenInput } from "../../dataModels";
import { genericValidateTokenInputs } from "../validateAssets";

export async function createErc20ApprovalTransaction(
  userAddress: string,
  opportunityChain: string,
  assetAndAmount: TokenInput,
  spenderAddress: Address,
  nonceOffSet: number = 0,
) {
  const viemChain = getViemChainByInternalId(opportunityChain);
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

export async function createDualTokenApprovalTransactions(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
) {
  let txs = [];
  await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
  console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);

  const contractAddress = opportunity.contracts.find(
      (contract) => contract.type === "invest",
  )?.contractAddress;

  if (!contractAddress) {
      throw new Error("Invalid contract address");
  }

  let nonceOffSetPerTx = nonceOffSet;
  for (const tokenInput of tokenInputs) {
      const inputAssetAddress = tokenInput.asset.address;

      if (!inputAssetAddress) {
          throw new Error("Invalid input asset address");
      }

      const erc20ApprovalTx = await createErc20ApprovalTransaction(
          userAddress,
          opportunity.chain,
          tokenInput,
          contractAddress as Address,
          nonceOffSetPerTx,
      );
      txs.push(erc20ApprovalTx);
      nonceOffSetPerTx++;
  }

  return txs;
}
