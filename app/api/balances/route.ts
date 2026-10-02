import { cookies } from "next/headers";

import { PrivyClient } from "@privy-io/server-auth";
import { PortfolioProviderError } from "@/libs/debank";
import { getBalances } from "@/libs/portfolioAPI/portfolioAPI";
import { PORTFOLIO_UNAVAILABLE_MESSAGE } from "@/libs/portfolioErrors";
import { NextRequest, NextResponse } from "next/server";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);
export type BalanceSuccessResponse = {
  balances: {
    chain: string;
    balance: string;
    symbol: string;
    usdValue: number;
  }[];
};

export type BalanceErrorResponse = {
  error: string;
  code?: string;
};

/*
Not being used right now, depending on debank for balances.
async function getNativeAssetBalance(address: Address, viemChain: Chain) {
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });

  const balance = await client.getBalance({ address });
  return formatUnits(balance, viemChain.nativeCurrency.decimals);
}

async function getERC20Balance(
  address: Address,
  viemChain: Chain,
  assetAddress: string
) {
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });

  const contract = getContract({
    address: assetAddress as Address,
    abi: erc20ABI,
    client: client,
  });

  const balance = await contract.read.balanceOf([address]);
  const decimals = await contract.read.decimals();
  return formatUnits(balance, decimals);
}
*/


export async function POST(req: NextRequest) {
  // const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  try {
    const headerAuthToken = req.headers
      .get("authorization")
      ?.replace(/^Bearer /, "");
    const cookieStore = await cookies();
    const cookieAuthToken = cookieStore.get("privy-token")?.value;
    const body = await req.json()
    console.log('BODY', body)
    const address = body.address;

    const authToken = cookieAuthToken || headerAuthToken;
    if (!authToken)
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );

    await client.verifyAuthToken(authToken);

    const balances = await getBalances(address);

    return NextResponse.json({ balances: balances });
  } catch (e: any) {
    if (e instanceof PortfolioProviderError) {
      // Log a summary only: the underlying AxiosError carries the request
      // headers, and dumping it would leak the provider API key into logs.
      console.error(
        `[api/balances] portfolio provider unavailable (status: ${
          e.providerStatus ?? "network error"
        }): ${e.message}`,
      );
      return NextResponse.json(
        {
          error: PORTFOLIO_UNAVAILABLE_MESSAGE,
          code: e.code,
        } satisfies BalanceErrorResponse,
        { status: 503 },
      );
    }
    console.error("[api/balances] unexpected error:", e?.message ?? e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

//Deprecated for now.
/*
async function getBalancesFromBlockchain(address: Address){
  const chainsMetadata = await getChainData();

  let balances: {
    chain: string;
    balance: string;
    symbol: string;
    usdValue: number;
  }[] = [];

  for (const chainMetadata of chainsMetadata) {
    const viemChain = getViemChain(chainMetadata.id);

    for (const asset of chainMetadata.assets) {
      try {
        let balance: string;
        if (asset.type === "NATIVE") {
          balance = await getNativeAssetBalance(address, viemChain);
        } else {
          if (!asset.address) continue;
          balance = await getERC20Balance(address, viemChain, asset.address);
        }

        const usdValue = asset.priceUSD
          ? parseFloat(balance) * asset.priceUSD
          : 0;

        balances.push({
          chain: chainMetadata.name,
          balance: balance.toString(),
          symbol: asset?.symbol || "",
          usdValue: usdValue,
        });
      } catch (e) {
        console.log(
          `error getting balance for ${asset.symbol} on ${chainMetadata.name}`,
        );
        balances.push({
          chain: chainMetadata.name,
          balance: "N/A",
          symbol: asset?.symbol || "",
          usdValue: 0,
        });
      }
    }
  }
  return balances;
}
*/
