import type { ChainMetadata } from "@/libs/portfolioAPI/types";

/**
 * GoldRush slug resolution is DB-backed: `byx_chain_metadata.goldrush_name` is the
 * single source of truth (see the goldrush_columns migration). There is intentionally
 * no in-code fallback map any more - an unpopulated column resolves to null and the
 * caller hides the chain rather than guessing.
 *
 * Every slug ever verified against the live API is recorded here so it never has to be
 * re-derived. All of these returned HTTP 200 on balances_v2; a wrong slug yields a 404
 * that looks like an outage:
 *   eth-mainnet, arbitrum-mainnet, base-mainnet, berachain-mainnet,
 *   eth-sepolia, arbitrum-sepolia
 * The two sepolia slugs are verified but currently unconfigured - populate
 * `goldrush_name` to enable them.
 *
 * The three chains with no slug are deliberately excluded and hidden under GoldRush per
 * the "hide unsupported chains" decision. The exclusions are NOT uniform, so do not
 * treat them as one signal:
 *   - `base-sepolia`, `berachain-testnet`: 501, i.e. GoldRush reports the chain as
 *     unsupported. This is a support fact, and the only case a message-based
 *     "not supported" check can identify.
 *   - `ethereum-holesky`: 552 with the body "Connection to web3 provider failed". That
 *     is an outage-shaped status, NOT a "not supported" signal, and `isProviderOutage`
 *     in libs/portfolioAPI/errors.ts classifies every `>= 500` status as an outage. A
 *     message-based check can therefore never recognise a 552.
 *
 * This means the static per-chain `supportedByGoldrush` pre-filter is load-bearing, not
 * a nicety: it is the only thing hiding those chains. Do not replace it with
 * message-based detection.
 */
export function resolveGoldrushSlug(chain: ChainMetadata): string | null {
  return chain.goldrushName ?? null;
}
