import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);
import { getOpportunityById } from "../../../database/queries";
import { getWithdrawalStatus } from "../engine";

export type Response = {
  data: any;
};

export type ErrorResponse = {
  error: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response | ErrorResponse>,
) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  const userAddress = req.query.userAddress as string;
  const opportunityId = req.query.opportunityId as string;
  if (!userAddress) {
    return res.status(401).json({ error: "Missing user address" });
  }
  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return res.status(401).json({ error: "Missing auth token" });
  try {
    await client.verifyAuthToken(authToken);
    const opportunity = await getOpportunityById(opportunityId);
    
    if (!opportunity)
      return res.status(404).json({ error: "Opportunity not found" });
    const data = await getWithdrawalStatus(opportunity, userAddress);
    console.log(data);
    return res.status(200).json({ data });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
}

export default handler;
