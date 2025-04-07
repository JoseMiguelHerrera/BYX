import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
import { Asset } from "../dataModels";
import { withdraw } from "../engine/withdraw";
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

export async function POST(req: NextRequest) {
  const headerAuthToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies.get("privy-token")?.value;
  const body = await req.json();

  const smartWalletAddress = body.smartWalletAddress;
  const chainId = body.chainId;
  const asset = body.asset  as Asset;
  const amount = body.amount;
  const recipientAddress = body.recipientAddress;

  if(!smartWalletAddress || !chainId || !asset || !amount || !recipientAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

    const txHash = await withdraw(
      smartWalletAddress,
      chainId,
      asset,
      amount,
      recipientAddress,
    );
    
    return NextResponse.json({ transaction: txHash }, { status: 200 });
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
