import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
import { Asset, mockOpportunities, TokenInput, TransactionType } from "./mockDB";
import { createTransaction } from "./engine";
import { withdraw } from "./engine/withdraw";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type BalanceSuccessResponse = {
  transaction: any;
};

export type BalanceErrorResponse = {
  error: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceSuccessResponse | BalanceErrorResponse>,
) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];
  const body = req.body;

  const smartWalletAddress = body.smartWalletAddress;
  const chainId = body.chainId;
  const asset = body.asset  as Asset;
  const amount = body.amount;
  const recipientAddress = body.recipientAddress;

  if(!smartWalletAddress || !chainId || !asset || !amount || !recipientAddress) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return res.status(401).json({ error: "Missing auth token" });
  try {
    const verifiedUser = await client.verifyAuthToken(authToken);
    const userID=verifiedUser.userId;
    const userObject = await client.getUserById(userID);
    if(userObject.linkedAccounts.length === 0) {
      return res.status(403).json({ error: "User has no linked accounts" });
    }
    const isUserWallet = userObject.linkedAccounts.some(
      (linkedAccount: any) => linkedAccount.address.toLowerCase() === smartWalletAddress.toLowerCase()
    );
    if (!isUserWallet) {
      return res.status(403).json({ error: "Not authorized to use this wallet address" });
    }

    const txHash = await withdraw(
      smartWalletAddress,
      chainId,
      asset,
      amount,
      recipientAddress,
    );
    
    return res.status(200).json({ transaction: txHash });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
  

}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true, // This tells Next.js this route might take longer to resolve
  },
};

export default handler;
