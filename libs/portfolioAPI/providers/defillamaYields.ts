import { createLlamaGet } from "@/libs/portfolioAPI/providers/defillamaClient";

const LLAMA_YIELDS_BASE_URL = "https://yields.llama.fi";

/**
 * A pool as published by `GET https://yields.llama.fi/pools`. Only `pool` and
 * `apy` are read by the refresh job; the rest are carried because they are what
 * the opportunity -> pool mapping was built from and are useful in logs.
 */
export interface LlamaPool {
  pool: string;
  /** Display name ("Ethereum"), NOT the price API's slug. Unused at runtime. */
  chain: string;
  project: string;
  symbol: string;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  underlyingTokens: string[] | null;
}

export interface LlamaPoolsResponse {
  status: string;
  data: LlamaPool[];
}

/** Yield API transport. Keyless, same retry/error semantics as `llamaGet`. */
export const llamaYieldsGet = createLlamaGet(LLAMA_YIELDS_BASE_URL);
