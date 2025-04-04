import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);
import { ChainMetadata } from "./dataModels";
import { getChainMetadata } from "../../database/queries";

export type ChainsAssetsSuccessResponse = {
  chains: ChainMetadata[];
};

export type ChainsAssetsErrorResponse = {
  error: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChainsAssetsSuccessResponse | ChainsAssetsErrorResponse>,
) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return res.status(401).json({ error: "Missing auth token" });
  try {
    await client.verifyAuthToken(authToken);
    const chainsMetadata = await getChainMetadata();

    return res.status(200).json({ chains: chainsMetadata });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
}

export default handler;
