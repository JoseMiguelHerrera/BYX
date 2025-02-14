import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);
import { mockOpportunities, OpportunityData } from "./mockDB";

export type OpportunitiesSuccessResponse = {
  opportunities: OpportunityData[];
};

export type OpportunitiesErrorResponse = {
  error: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OpportunitiesSuccessResponse | OpportunitiesErrorResponse>
) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return res.status(401).json({ error: "Missing auth token" });

  try {
    await client.verifyAuthToken(authToken);
    return res.status(200).json({ opportunities: mockOpportunities });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

export default handler;
