import { DebankTokenInfo } from "@/app/api/dataModels";
import { getChainMetadata } from "@/database/queries";
import axios from "axios";
import dotenv from "dotenv";
import { Address } from "viem";
dotenv.config();

const DEBANK_API_KEY = process.env.DEBANK_API_KEY;
if (!DEBANK_API_KEY) {
  throw new Error("DEBANK_API_KEY is not set");
}



export async function getAllUserTokenList(userAddress: string) {
    const response = await axios.get(
        `https://pro-openapi.debank.com/v1/user/all_token_list?id=${userAddress}&is_all=true`,
        {
            headers: {
                'AccessKey': DEBANK_API_KEY
            }
        }
    );
    return response.data;
}

export type TokenInfo = {
    id: string;               // Token contract address
    chain: string;            // Chain identifier (e.g., "eth")
    name: string;             // Full name of the token
    symbol: string;           // Token symbol
    display_symbol: string | null;  // Alternative display symbol if available
    optimized_symbol: string; // Optimized version of the symbol
    decimals: number;         // Number of decimal places for the token
    logo_url: string;         // URL to the token's logo image
    protocol_id: string;      // Protocol identifier (if any)
    price: number;            // Current price in USD
    is_verified: boolean;     // Whether the token is verified
    is_core: boolean;         // Whether it's a core token
    is_wallet: boolean;       // Whether it's a wallet token
    time_at: number;          // Timestamp (likely creation or update time)
  }

export type UserTokenBalanceInfo = {
  id: string;                // Token contract address
  chain: string;             // Chain identifier (e.g., "bera")
  name: string;              // Full name of the token
  symbol: string;            // Token symbol
  display_symbol: string | null; // Alternative display symbol if available
  optimized_symbol: string;  // Optimized version of the symbol
  decimals: number;          // Number of decimal places for the token
  logo_url: string | null;   // URL to the token's logo image (can be null)
  protocol_id: string;       // Protocol identifier (e.g., "bera_kodiak")
  price: number;             // Current price in USD
  price_24h_change: number | null; // 24-hour price change (can be null)
  credit_score: number;      // Credit score (often 0)
  is_verified: boolean;      // Whether the token is verified
  is_scam: boolean;          // Whether the token is flagged as a scam
  is_suspicious: boolean;    // Whether the token is flagged as suspicious
  is_core: boolean | null;   // Whether it's a core token (can be null)
  is_wallet: boolean;        // Whether it's a wallet token
  time_at: number;           // Timestamp (likely update time)
  low_credit_score: boolean; // Indicates a low credit score
  amount: number;            // Token balance amount (floating point)
  raw_amount: number;        // Token balance amount in raw format (integer)
  raw_amount_hex_str: string; // Token balance amount in raw format (hex string)
};

export async function getTokenInfo(chainId: string, tokenAddress: string): Promise<TokenInfo> {
    console.log(chainId, tokenAddress)
    const response = await axios.get(
        `https://pro-openapi.debank.com/v1/token?chain_id=${chainId}&id=${tokenAddress}`,
        {
            headers: {
                'AccessKey': DEBANK_API_KEY
            }
        }
    );
    return response.data as TokenInfo;
}

export async function getUserTokenBalanceInfo(
  userAddress: string,
  chainId: string,
  tokenId: string
): Promise<UserTokenBalanceInfo> {
  const response = await axios.get(
    `https://pro-openapi.debank.com/v1/user/token?id=${userAddress}&chain_id=${chainId}&token_id=${tokenId}`,
    {
      headers: {
        'AccessKey': DEBANK_API_KEY,
      },
    }
  );
  return response.data as UserTokenBalanceInfo;
}

export interface UserTokenInfo {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol: string | null;
  optimized_symbol: string;
  decimals: number;
  logo_url: string | null;
  protocol_id: string;
  price: number;
  price_24h_change: number | null;
  is_verified: boolean;
  is_core: boolean | null;
  is_wallet: boolean;
  time_at: number;
  credit_score: number;
  amount: number;
  raw_amount: number;
  raw_amount_hex_str: string;
}

/**
 * Fetches the list of tokens held by a user on a specific chain.
 * Corresponds to curl command:
 * curl -X 'GET' \
 *   'https://pro-openapi.debank.com/v1/user/token_list?id={userAddress}&chain_id={chainId}&is_all={is_all}' \
 *   -H 'accept: application/json' -H 'AccessKey: {DEBANK_API_KEY}'
 * @param userAddress The user's wallet address.
 * @param chainId The DeBank chain ID (e.g., 'eth', 'bsc').
 * @param is_all Whether to fetch all tokens (including those with zero balance). Defaults to false.
 * @returns A promise that resolves to an array of UserTokenInfo objects.
 */
export async function getUserTokenList(
  userAddress: string,
  chainId: string,
): Promise<UserTokenInfo[]> {
  const response = await axios.get(
    `https://pro-openapi.debank.com/v1/user/token_list?id=${userAddress}&chain_id=${chainId}&is_all=${true}`,
    {
      headers: {
        'AccessKey': DEBANK_API_KEY,
        'accept': 'application/json', // Explicitly set accept header
      },
    }
  );
  // The API returns an array directly
  return response.data as UserTokenInfo[];
}


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