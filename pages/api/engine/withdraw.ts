import { Chain, encodeFunctionData, http, parseUnits, PublicClient } from "viem";
import { Address, createPublicClient } from "viem";
import { Asset } from "../mockDB";
import { getViemChain } from "./chainPicker";
import { erc20ABI } from "../abis";
import ServerSideTransactions from "./serverSideTransactions";

export async function withdraw(
  smartWalletAddress: string,
  chainId: string,
  asset: Asset,
  amount: string,
  recipientAddress: Address,
) {

    const viemChain = getViemChain(chainId);
    const client = createPublicClient({
      chain: viemChain,
      transport: http(), // Use default RPC
    });
    const serverSideTransactions = new ServerSideTransactions();

    const nonce =
      (await client.getTransactionCount({ address: smartWalletAddress as Address }))

      const amountVal = parseUnits(amount, asset.decimals);
    let tx;
      if(asset.type === "NATIVE") {
        tx= await createNativeSendTransaction(viemChain, amountVal, recipientAddress, nonce, client);
      } else if(asset.type === "ERC20") {
        tx= await createErc20SendTransaction(viemChain, amountVal, asset, recipientAddress, nonce, client);
      } else {
        throw new Error(`Asset type ${asset.type} withdrawal not supported`);
      }

      return serverSideTransactions.sendTransactions(
        chainId,
        smartWalletAddress,
        [tx],
      );
}


async function createErc20SendTransaction(
  viemChain: Chain,
  amount: bigint,
  asset: Asset,
  recipientAddress: Address,
  nonce: number,
  client: PublicClient
) {
    const data = encodeFunctionData({
        abi: erc20ABI,
        functionName: "transfer",
        args: [recipientAddress, amount],
      });
      const transaction= {
        chainId: viemChain.id,
        to: asset.address,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
      };
      return { transaction, wait: client.waitForTransactionReceipt };
}

async function createNativeSendTransaction(
    viemChain: Chain,
    amount: bigint,
    recipientAddress: Address,
    nonce: number,
    client: PublicClient
  ) {
        const transaction= {
          chainId: viemChain.id,
          to: recipientAddress,
          value: `0x${amount.toString(16)}`,
          nonce,
          data: `0x`,
        };
        return { transaction, wait: client.waitForTransactionReceipt };

  }