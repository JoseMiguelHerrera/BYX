import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, Address,Chain, formatUnits } from "viem";
import { PrivyClient } from "@privy-io/server-auth";
import { arbitrum, arbitrumSepolia, base, baseSepolia, berachain, berachainTestnet, mainnet, sepolia } from 'viem/chains'//hard coded for now
import { ChainMetadata, mockChains } from "./mockDB";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type BalanceSuccessResponse = {
    balances: {chain: string, balance: string, symbol: string, usdValue: number}[];
};

export type BalanceErrorResponse = {
    error: string;
};

//will be from db at some point
async function getChainData(){
    return mockChains;
}

function getViemChain(chain: ChainMetadata): Chain {
   switch(chain.id) {
    case 'arbitrum-sepolia':
        return arbitrumSepolia;
    case 'arbitrum':
        return arbitrum;
    case 'ethereum-sepolia':
        return sepolia;
    case 'ethereum':
        return mainnet;
    case 'base':
        return base;
    case 'base-sepolia':
        return baseSepolia;
    case 'berachain':
        return berachain;
    case 'berachain-testnet':
        return berachainTestnet;
   }
   throw new Error('Invalid chain');
  };

async function getNativeAssetBalance(address: Address, viemChain: Chain) {
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });

    const balance = await client.getBalance({ address });
    return formatUnits(balance, viemChain.nativeCurrency.decimals);
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<
        BalanceSuccessResponse | BalanceErrorResponse
    >,
) {
    const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
    const cookieAuthToken = req.cookies["privy-token"];
    const address = req.body.address;
   
    const authToken = cookieAuthToken || headerAuthToken;
    if (!authToken) return res.status(401).json({ error: "Missing auth token" });
    try {
        await client.verifyAuthToken(authToken);

        const chainsMetadata = await getChainData();

        let balances: {chain: string, balance: string, symbol: string, usdValue: number}[] = [];
        for(const chainMetadata of chainsMetadata){
            const viemChain = getViemChain(chainMetadata);
            const balance = await getNativeAssetBalance(address,viemChain);
            const nativeAsset = chainMetadata.assets[0];
            const usdValue = nativeAsset?.priceUSD ? parseFloat(balance) * nativeAsset.priceUSD : 0;
            
            balances.push({
                chain: chainMetadata.name, 
                balance: balance.toString(), 
                symbol: nativeAsset?.symbol || '',
                usdValue: usdValue
            });
        }

        
        return res.status(200).json({ balances: balances });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }

}

export default handler;
