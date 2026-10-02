import type { ChainMetadata } from "@/libs/portfolioAPI/types";
import { llamaGet } from "@/libs/portfolioAPI/providers/defillamaClient";

/** GoldRush's native-asset placeholder, which DefiLlama cannot price. */
const NATIVE_PLACEHOLDER_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

/**
 * Chunk size for the request path. The spec measured 43 addresses in one request,
 * but `getTokenList` prices every token a wallet holds, so the unpriced subset can
 * be in the thousands and would otherwise exceed the URL limit - the same failure
 * GoldRush returned a 414 for at 200 addresses (see goldrushProvider).
 */
const LLAMA_CHUNK_SIZE = 50;

interface LlamaCoin {
  price?: number | null;
  confidence?: number | null;
}

interface LlamaPricesResponse {
  coins?: Record<string, LlamaCoin>;
}

/**
 * DefiLlama slug resolution is DB-backed, exactly like `resolveGoldrushSlug`:
 * `byx_chain_metadata.defillama_name` is the single source of truth. Null means
 * "no fallback for this chain".
 *
 * The column exists rather than using our chain id directly because the two
 * schemes are different vendors' vocabularies - DefiLlama says `ethereum` where
 * GoldRush says `eth-mainnet`. They happen to coincide for all four configured
 * chains today, but that is a verified data fact per chain, not a rule to assume:
 * a newly added chain must have its slug confirmed before it gets a fallback.
 */
export function resolveLlamaSlug(chain: ChainMetadata): string | null {
  return chain.defillamaName ?? null;
}

/**
 * Fill the addresses GoldRush left unpriced from DefiLlama, one batched call per
 * chunk of a single chain.
 *
 * GoldRush cannot price anything whose value is a pool share: every Uniswap V2
 * `UNI-V2` pair and every berachain Island comes back `null`. That is
 * not cosmetic - `getUserPosition` requires `price > 0`, so those positions would
 * drop and new transactions would record a $0 leg. DefiLlama's coverage is the
 * exact complement (17/20 berachain Islands, 4/4 Uniswap V2, corroborated to
 * 0.96% against the price DeBank actually charged), so it fills precisely the hole.
 *
 * `slug` is the already-resolved DefiLlama chain slug; null means the chain has no
 * fallback and the prices pass through untouched.
 *
 * Returns a NEW map; the caller's map is never mutated. Native sentinels are
 * excluded on purpose: GoldRush's `0xeeee...eeee` path already prices natives, and
 * DefiLlama is weak on them (`coingecko:berachain` misses).
 *
 * Failure degrades to GoldRush's zeros instead of propagating. This is a
 * supplementary price source: a DefiLlama outage must not trip the fail-closed
 * gate and hide an otherwise-complete portfolio. The cost of degrading is only the
 * pre-fallback behaviour for LP tokens. The loop stops at the first failed chunk
 * rather than hammering a struggling endpoint with the remaining ones.
 */
export async function mergeLlamaFallback(
  slug: string | null,
  addresses: string[],
  prices: Map<string, number>,
): Promise<Map<string, number>> {
  if (!slug) return prices;

  const missing = [
    ...new Set(
      addresses
        .map((a) => a.toLowerCase())
        .filter((a) => Boolean(a) && a !== NATIVE_PLACEHOLDER_ADDRESS)
        .filter((a) => !((prices.get(a) ?? 0) > 0)),
    ),
  ];
  if (missing.length === 0) return prices;

  const merged = new Map(prices);
  for (let i = 0; i < missing.length; i += LLAMA_CHUNK_SIZE) {
    const chunk = missing.slice(i, i + LLAMA_CHUNK_SIZE);
    const coins = chunk.map((a) => `${slug}:${a}`).join(",");
    try {
      const data = await llamaGet<LlamaPricesResponse>(`/prices/current/${coins}`);
      for (const [key, coin] of Object.entries(data?.coins ?? {})) {
        const address = key.slice(key.indexOf(":") + 1).toLowerCase();
        const price = coin?.price;
        if (typeof price === "number" && Number.isFinite(price) && price > 0) {
          merged.set(address, price);
        }
      }
    } catch (error) {
      console.warn(
        `[portfolioAPI] DefiLlama price fallback failed for chain slug ${slug}; ` +
          `unpriced tokens keep their GoldRush result:`,
        error instanceof Error ? error.message : error,
      );
      return merged;
    }
  }
  return merged;
}
