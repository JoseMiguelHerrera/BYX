import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
import { AssetAmount, TokenInput, TransactionType } from "./dataModels";
import { createTransaction } from "./engine";
import { getOpportunityById,writeTransactions } from "../../database/queries";
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
  const opportunityId = body.opportunityId;
  const tokenInputs = body.tokenInputs as TokenInput[];
  const type = body.type as TransactionType;

  const extraData = body.extraData as any[] | undefined;

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
    const opportunity = await getOpportunityById(opportunityId);
    if (!opportunity)
      return res.status(404).json({ error: "Opportunity not found" });
    const txHash = await createTransaction(
      opportunity,
      smartWalletAddress,
      tokenInputs,
      type,
      extraData,
    );
    await writeTransactions([{
      id: crypto.randomUUID(),
      userId: userID,
      userAddress: smartWalletAddress,
      type: type,
      opportunityId: opportunityId,
      inputAssets: [],//TODO: we need to get the input assets from createTransaction
      outputAssets: [],//TODO: we need to get the output assets from createTransaction
      createdAt: Date.now(),
      transactionHash: txHash[txHash.length-1]as string,//rule of thumb: the last transaction is the one that creates the transaction
    }])
    return res.status(200).json({ transaction: txHash[txHash.length-1] });
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
