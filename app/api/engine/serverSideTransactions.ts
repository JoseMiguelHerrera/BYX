import { PrivyClient } from "@privy-io/server-auth";
import dotenv from "dotenv";
import { Address, http } from "viem";
import { createPublicClient } from "viem";
import { getViemChainByInternalId } from "./chainPicker";
dotenv.config();

export default class ServerSideTransactions {
  public client: PrivyClient;//for now for testing make this public
  constructor() {
    if (
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID ||
      !process.env.PRIVY_APP_SECRET ||
      !process.env.PRIVY_DELEGATION_KEY
    ) {
      throw new Error("Missing Privy environment variables");
    }
    this.client = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET,
      {
        walletApi: {
          authorizationPrivateKey: process.env.PRIVY_DELEGATION_KEY,
        },
      },
    );
  }

  async simulateTransactions(
    chain: string,
    userAddress: string,
    transactions: any[],
  ) {
    if (chain === "arbitrum") {
      //TODO: figure out how to simulate arbitrum transactions if this way is not possible.
      console.log("Simulation not supported for arbitrum");
      return;
    }
    console.log("userAddress", userAddress);
    const viemChain = getViemChainByInternalId(chain);
    const client = createPublicClient({
      chain: viemChain,
      transport: http(),
    });

    try {
      const simulationResult = await client.simulateCalls({
        account: userAddress as Address,
        calls: transactions.map((tx: any) => ({
          to: tx.transaction.to,
          data: tx.transaction.data,
          value: tx.transaction.value,
        })),
        stateOverrides: [
          {
            address: userAddress as Address,
            nonce: transactions[0].transaction.nonce,
          },
        ],
      });
      console.log("Simulated transaction(s)", simulationResult);
    } catch (e: any) {
      console.log("Error simulating transaction(s)", e);
      throw e;
    }
  }

  async sendTransactions(
    chain: string,
    userAddress: string,
    transactions: any[],
  ) {
    //TODO: we need to have a check to make sure the user has enough balance to send the transactions
    await this.simulateTransactions(chain, userAddress, transactions);
    let hashes: string[] = [];

    for (const tx of transactions) {
      console.log("Attempting to send transaction", tx);
      const { hash } = await this.client.walletApi.ethereum.sendTransaction({
        address: userAddress,
        chainType: "ethereum",
        caip2: `eip155:${tx.transaction.chainId}`,
        transaction: tx.transaction,
      });
      console.log("waiting for transaction", hash);
      await tx.wait({
        hash: hash as `0x${string}`,
      });
      console.log(`Sent transaction ${hash}`);
      hashes.push(hash);
    }

    return hashes;
  }
}
