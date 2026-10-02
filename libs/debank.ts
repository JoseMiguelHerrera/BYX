import { DebankTokenInfo } from "@/app/api/dataModels";
import { aggregateBalances } from "@/libs/portfolioAPI/aggregate";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { debankProvider } from "@/libs/portfolioAPI/providers/debankProvider";
import axios from "axios";
import dotenv from "dotenv";
import { Address } from "viem";
dotenv.config();

const DEBANK_API_BASE_URL = "https://pro-openapi.debank.com";

// Without a timeout a provider that hangs (rather than erroring) leaves the
// request, and therefore the UI, stuck loading forever.
const DEBANK_REQUEST_TIMEOUT_MS = 15_000;

// Re-exported so every existing import site keeps working. The implementation
// lives in the neutral layer to keep the dependency graph acyclic
// (debank -> aggregate -> errors, never aggregate -> debank).
export { PortfolioProviderError } from "@/libs/portfolioAPI/errors";

async function debankGet<T>(
  path: string,
  params: Record<string, string | number | boolean>,
): Promise<T> {
  // Checked here rather than at module load: this module is always imported
  // (the provider selection imports debankProvider unconditionally), so a
  // module-level throw would break GoldRush-only deployments that legitimately
  // have no DeBank key.
  const apiKey = process.env.DEBANK_API_KEY;
  if (!apiKey) {
    throw new PortfolioProviderError(
      "DEBANK_API_KEY is not set but the debank provider was invoked",
      { providerStatus: undefined },
    );
  }
  try {
    const response = await axios.get<T>(`${DEBANK_API_BASE_URL}${path}`, {
      params,
      timeout: DEBANK_REQUEST_TIMEOUT_MS,
      headers: {
        "AccessKey": apiKey,
        "accept": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const providerStatus = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    throw new PortfolioProviderError(
      `Portfolio provider request to ${path} failed${
        providerStatus ? ` with status ${providerStatus}` : ""
      }`,
      { providerStatus, cause: error },
    );
  }
}

/**
 * The subset of DeBank's `all_token_list` entry this codebase reads. The endpoint
 * returns more fields, but typing only what is consumed keeps the single caller
 * (`debankProvider`) honest - a renamed field becomes a compile error instead of a
 * silent `undefined`.
 */
export interface DebankAllTokenEntry {
  chain: string;
  symbol: string;
  amount: number | null;
  price: number | null;
}

export async function getAllUserTokenList(
  userAddress: string,
): Promise<DebankAllTokenEntry[]> {
  return debankGet<DebankAllTokenEntry[]>("/v1/user/all_token_list", {
    id: userAddress,
    is_all: true,
  });
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
    return debankGet<TokenInfo>("/v1/token", {
        chain_id: chainId,
        id: tokenAddress,
    });
}

export async function getUserTokenBalanceInfo(
  userAddress: string,
  chainId: string,
  tokenId: string
): Promise<UserTokenBalanceInfo> {
  return debankGet<UserTokenBalanceInfo>("/v1/user/token", {
    id: userAddress,
    chain_id: chainId,
    token_id: tokenId,
  });
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
  // The API returns an array directly.
  return debankGet<UserTokenInfo[]>("/v1/user/token_list", {
    id: userAddress,
    chain_id: chainId,
    is_all: true,
  });
}


//This only gets you the "chain assets" aka the funding assets.
export async function getBalancesFromDebank(address: Address): Promise<DebankTokenInfo[]> {
  // Delegates to the shared aggregator so the matching, native-asset and
  // zero-fill rules exist in exactly one place for both providers.
  return aggregateBalances(debankProvider, address);
}