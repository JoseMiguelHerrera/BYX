import { cookies } from "next/headers";
import {
  createPublicClient,
  http,
  Address,
  Chain,
  formatUnits,
  getContract,
} from "viem";
import { PrivyClient } from "@privy-io/server-auth";
import { erc20ABI } from "../abis";
import { getAllUserTokenList, getTokenInfo } from "@/libs/debank";
import { getChainMetadata } from "../../../database/queries";
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
};

// async function getNativeAssetBalance(address: Address, viemChain: Chain) {
//   const client = createPublicClient({
//     chain: viemChain,
//     transport: http(), // Use default RPC
//   });

//   const balance = await client.getBalance({ address });
//   return formatUnits(balance, viemChain.nativeCurrency.decimals);
// }

// async function getERC20Balance(
//   address: Address,
//   viemChain: Chain,
//   assetAddress: string
// ) {
//   const client = createPublicClient({
//     chain: viemChain,
//     transport: http(), // Use default RPC
//   });

//   const contract = getContract({
//     address: assetAddress as Address,
//     abi: erc20ABI,
//     client: client,
//   });

//   const balance = await contract.read.balanceOf([address]);
//   const decimals = await contract.read.decimals();
//   return formatUnits(balance, decimals);
// }

export interface DebankTokenInfo {
  chain: string;
  balance: string;
  symbol: string;
  usdValue: number;
  price: number;
  isNativeAsset: boolean;
}

//This should go somewhere else like in a debank api wrapper.
//This only gets you the "chain assets" aka the funding assets.
export async function getBalancesFromDebank(address: Address): Promise<DebankTokenInfo[]> {
  //When we have the database, this should be cached.
  const chainsMetadata = await getChainMetadata();

  let balances: DebankTokenInfo[] = [] as DebankTokenInfo[];
  const debankTokenList = await getAllUserTokenList(address);
  for (const chainMetadata of chainsMetadata) {
    for (const asset of chainMetadata.assets) {
      try {
        const debankTokenInfo = debankTokenList.find(
          (debankTokenEntry: any) =>
            debankTokenEntry.chain === chainMetadata.debankName &&
            debankTokenEntry.symbol === asset.symbol
        );
        if (!debankTokenInfo) {
          throw new Error(
            `Token ${asset.symbol} in chain ${chainMetadata.name} not found in debank`
          );
        }
        const usdValue = debankTokenInfo.price * debankTokenInfo.amount;
        balances.push({
          chain: chainMetadata.name,
          balance: debankTokenInfo.amount.toString(),
          symbol: asset.symbol,
          usdValue: usdValue,
          price: debankTokenInfo.price,
          isNativeAsset: asset.type==="NATIVE"
        });
      } catch (e: any) {
        let tokenIdentifier;
        //NOTE: This is a hack to get the token identifier for native assets, because debank names their native assets with the chain name.
        if(asset.type!=="NATIVE"){
          tokenIdentifier = asset.address;
        }else{
          tokenIdentifier = chainMetadata.debankName
        }
        try{
        const tokenInfo = await getTokenInfo(chainMetadata.debankName, tokenIdentifier as string);
        balances.push({
          chain: chainMetadata.name,
          balance: "0",
          symbol: asset.symbol,
          usdValue: 0,
          price: tokenInfo.price,
          isNativeAsset: asset.type==="NATIVE"
        });
        }catch(e:any){
          balances.push({
            chain: chainMetadata.name,
            balance: "0",
            symbol: asset.symbol,
            usdValue: 0,
            price: 0,
            isNativeAsset: asset.type==="NATIVE"
          });
        }
      }
    }
  }
  return balances;
}
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

    const balances = await getBalancesFromDebank(address);

    return NextResponse.json({ balances: balances });
  } catch (e: any) {
    console.log(e)
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
