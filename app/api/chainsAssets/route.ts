import { PrivyClient } from "@privy-io/server-auth";
import { ChainMetadata } from "../dataModels";
import { getChainMetadata } from "../../../database/queries";
import { NextRequest, NextResponse } from "next/server";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type ChainsAssetsSuccessResponse = {
  chains: ChainMetadata[];
};

export type ChainsAssetsErrorResponse = {
  error: string;
};

export async function GET(req: NextRequest) {
  const headerAuthToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies.get("privy-token")?.value;

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  try {
    await client.verifyAuthToken(authToken);
    const chainsMetadata = await getChainMetadata();

    return NextResponse.json({ chains: chainsMetadata }, { status: 200 });
  } catch (e: any) {
    console.log(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
