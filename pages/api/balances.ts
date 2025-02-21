import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, Address,Chain, formatUnits, getContract } from "viem";
import { PrivyClient } from "@privy-io/server-auth";
import { mockChains } from "./mockDB";
import { getViemChain } from "./engine/chainPicker";
import { erc20ABI } from "./abis";
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

async function getNativeAssetBalance(address: Address, viemChain: Chain) {
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });

    const balance = await client.getBalance({ address });
    return formatUnits(balance, viemChain.nativeCurrency.decimals);
}

async function getERC20Balance(address: Address, viemChain: Chain, assetAddress: string) {
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });

    const contract = getContract({
        address: assetAddress as Address,
        abi: erc20ABI,
        client: client,
    });

    const balance = await contract.read.balanceOf([address]);
    const decimals = await contract.read.decimals();
    return formatUnits(balance, decimals);
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
            const viemChain = getViemChain(chainMetadata.id);

            for(const asset of chainMetadata.assets){

                try{
                let balance: string;
                if(asset.isNative){
                    balance = await getNativeAssetBalance(address,viemChain);
                } else {
                    if(!asset.address) continue;
                    balance = await getERC20Balance(address,viemChain,asset.address);
                }

                const usdValue = asset.priceUSD ? parseFloat(balance) * asset.priceUSD : 0;

                balances.push({
                    chain: chainMetadata.name, 
                    balance: balance.toString(), 
                    symbol: asset?.symbol || '',
                    usdValue: usdValue
                });
            }catch(e){
                console.log(`error getting balance for ${asset.symbol} on ${chainMetadata.name}`)
                balances.push({
                    chain: chainMetadata.name, 
                    balance: 'N/A', 
                    symbol: asset?.symbol || '',
                    usdValue: 0
                });
            }

            }


        }

        
        return res.status(200).json({ balances: balances });
    } catch (e: any) {
        console.log(e);
        return res.status(500).json({ error: e.message });
    }

}

export default handler;
