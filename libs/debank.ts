import axios from "axios";
import dotenv from "dotenv";
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
