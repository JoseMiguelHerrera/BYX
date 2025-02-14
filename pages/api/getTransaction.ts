import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, Address,Chain, formatUnits, getContract, Transaction } from "viem";
import { PrivyClient } from "@privy-io/server-auth";
import { Asset, moc, TokenInputkChains, mockOpportunities, TokenInput } from "./mockDB";
import { getViemChain } from "./engine/chainPicker";
import { erc20ABI } from "./abis";
import { OpportunityData } from "./mockDB";
import { createTransaction } from "./engine";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type BalanceSuccessResponse = {
    transaction: any;
};

export type BalanceErrorResponse = {
    error: string;
};

//will be from db at some point
async function getOpportunityData(opportunityId: string){
    return mockOpportunities.find(opportunity => opportunity.id === opportunityId);
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
    const body = req.body;

    const smartWalletAddress = body.smartWalletAddress;
    const opportunityId = body.opportunityId;
    const tokenInputs = body.tokenInputs as TokenInput[];
    //const amount = body.amount;//TODO: make so amounts are an array

    const authToken = cookieAuthToken || headerAuthToken;
    if (!authToken) return res.status(401).json({ error: "Missing auth token" });
    try {
        await client.verifyAuthToken(authToken);
        const opportunity = await getOpportunityData(opportunityId);
        if(!opportunity) return res.status(404).json({ error: "Opportunity not found" });
        if(!tokenInputs[0]) return res.status(404).json({ error: "Token input not found" });
        const tx = await createTransaction(opportunity, smartWalletAddress,tokenInputs );

        console.log(tx);
        return res.status(200).json({transaction: tx});
    } catch (e: any) {
        console.log(e);
        return res.status(500).json({ error: e.message });
    }

}

export default handler;
