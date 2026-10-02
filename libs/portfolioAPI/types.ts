import type { ChainMetadata, DebankTokenInfo } from "@/app/api/dataModels";
import type { TokenInfo, UserTokenBalanceInfo } from "@/libs/debank";

/**
 * Provider-neutral contract for portfolio data.
 *
 * The produced shapes are the ones `libs/debank.ts` already returned, because
 * consumers were written against them and must not need changes.
 *
 * These are ALIASES to the shapes DeBank already produced, not lookalike
 * redefinitions. The requirement is that GoldRush's output is 1:1 with what
 * consumers receive today. Aliasing makes that true by construction and
 * impossible to drift; a parallel interface would only be a promise to keep
 * them in sync.
 *
 * Consequence worth stating plainly: `PortfolioUserToken` and
 * `PortfolioTokenInfo` carry DeBank-only fields (`credit_score`, `is_verified`,
 * `protocol_id`, ...). The GoldRush adapter must therefore populate explicit
 * defaults for them. That is deliberate, not incidental.
 */
export type PortfolioToken = DebankTokenInfo;
export type PortfolioUserToken = UserTokenBalanceInfo;
export type PortfolioTokenInfo = TokenInfo;

/** The provider-facing chain shape, including `assets`. Reused, not reinvented. */
export type { ChainMetadata };

/**
 * Sentinel passed to `getTokenInfo` for a chain's native asset. Each provider
 * translates it to its own convention (DeBank uses the chain name; GoldRush
 * uses the 0xeeee...eeee placeholder), so provider quirkiness never reaches
 * the shared layer.
 */
export const NATIVE_TOKEN_IDENTIFIER = "__native__";

export interface PortfolioAPI {
  readonly name: "debank" | "goldrush";
  /** Static coverage check. Must not perform network I/O. */
  isChainSupported(chain: ChainMetadata): boolean;
  /**
   * Balances across every supplied chain, as one logical call.
   *
   * `chains` is passed in rather than re-read from the DB so providers stay free
   * of database access, and so the already-filtered supported set is the single
   * source of truth for what gets fetched. Each returned token's `chain` must be
   * the INTERNAL chain name (`ChainMetadata.name`), not a provider-specific one.
   */
  getAllTokenBalances(address: string, chains: ChainMetadata[]): Promise<PortfolioToken[]>;
  /** A single chain's tokens, with amounts in human-readable units. */
  getTokenList(address: string, chain: ChainMetadata): Promise<PortfolioUserToken[]>;
  /** Price/metadata for one token, which the user may not hold. */
  getTokenInfo(chain: ChainMetadata, tokenId: string): Promise<PortfolioTokenInfo>;
  /** Balance of one token, amount in human-readable units. */
  getUserTokenBalanceInfo(
    address: string,
    chain: ChainMetadata,
    tokenId: string,
  ): Promise<PortfolioUserToken>;
}
