import { PrivyClient } from "@privy-io/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserPosition } from "../../positions/getUserPosition";
import { PortfolioProviderError } from "@/libs/debank";
import {
  PORTFOLIO_UNAVAILABLE_CODE,
  PORTFOLIO_UNAVAILABLE_MESSAGE,
} from "@/libs/portfolioErrors";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type Response = {
  data: any;
};

export type ErrorResponse = {
  error: string;
};

export async function GET(req: NextRequest) {
  const headerAuthToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies.get("privy-token")?.value;

  const userAddress = req.nextUrl.searchParams.get("userAddress") as string;
  if (!userAddress) {
    return NextResponse.json({ error: "Missing user address" }, { status: 401 });
  }
  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  try {
    await client.verifyAuthToken(authToken);
    const data = await getUserPosition(userAddress);
    if(data){
      return NextResponse.json({data}, { status: 200 });
        } else {
        return NextResponse.json({ error: "No investment info found for this opportunity" }, { status: 404 });
    }
  } catch (e: any) {
    if (e instanceof PortfolioProviderError) {
      console.error(
        `[api/getters/getPositions] portfolio provider unavailable (status: ${
          e.providerStatus ?? "network error"
        })`,
      );
      return NextResponse.json(
        { error: PORTFOLIO_UNAVAILABLE_MESSAGE, code: PORTFOLIO_UNAVAILABLE_CODE },
        { status: 503 },
      );
    }
    console.log(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}