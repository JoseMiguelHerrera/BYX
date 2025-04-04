import { PrivyClient } from "@privy-io/server-auth";
import { TokenInput, TransactionType } from "../dataModels";
import { createTransaction } from "../engine";
import { getOpportunityById, writeTransactions } from "../../../database/queries";
import { NextRequest, NextResponse } from "next/server";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type BalanceSuccessResponse = {
  transaction: any;
};

export type BalanceErrorResponse = {
  error: string;
};


export async function GET(req: NextRequest) {
  const headerAuthToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies.get("privy-token")?.value;
  const body = await req.json();

  const smartWalletAddress = body.smartWalletAddress;
  const opportunityId = body.opportunityId;
  const tokenInputs = body.tokenInputs as TokenInput[];
  const type = body.type as TransactionType;

  const extraData = body.extraData as any[] | undefined;

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  try {
    const verifiedUser = await client.verifyAuthToken(authToken);
    const userID=verifiedUser.userId;
    const userObject = await client.getUserById(userID);
    if(userObject.linkedAccounts.length === 0) {
      return NextResponse.json({ error: "User has no linked accounts" }, { status: 403 });
    }
    const isUserWallet = userObject.linkedAccounts.some(
      (linkedAccount: any) => linkedAccount.address.toLowerCase() === smartWalletAddress.toLowerCase()
    );
    if (!isUserWallet) {
      return NextResponse.json({ error: "Not authorized to use this wallet address" }, { status: 403 });
    }
    const opportunity = await getOpportunityById(opportunityId);
    if (!opportunity)
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
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
    return NextResponse.json({ transaction: txHash[txHash.length-1] }, { status: 200 });
  } catch (e: any) {
    console.log(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true, // This tells Next.js this route might take longer to resolve
  },
};
