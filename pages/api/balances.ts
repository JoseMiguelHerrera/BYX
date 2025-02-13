import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, Address } from "viem";
import { PrivyClient } from "@privy-io/server-auth";
import { arbitrumSepolia } from 'viem/chains'//hard coded for now
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type BalanceSuccessResponse = {
    balance: string;
};

export type BalanceErrorResponse = {
    error: string;
};

async function getEthBalance(address: Address) {
    const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(), // Use default RPC
    });

    const balance = await client.getBalance({ address });
    return balance;
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
    console.log(address)

    const authToken = cookieAuthToken || headerAuthToken;
    if (!authToken) return res.status(401).json({ error: "Missing auth token" });
    console.log(authToken);
    try {
        await client.verifyAuthToken(authToken);
        const balance = await getEthBalance(address);
        return res.status(200).json({ balance: balance.toString() });
    } catch (e: any) {
        console.log(e)
        return res.status(500).json({ error: e.message });
    }

}

export default handler;
