import {
  getAllUserTokenList,
  getTokenInfo as debankGetTokenInfo,
  getUserTokenBalanceInfo as debankGetUserTokenBalanceInfo,
  getUserTokenList,
} from "@/libs/debank";
import { NATIVE_TOKEN_IDENTIFIER } from "@/libs/portfolioAPI/types";
import type {
  ChainMetadata,
  PortfolioAPI,
  PortfolioToken,
  PortfolioTokenInfo,
  PortfolioUserToken,
} from "@/libs/portfolioAPI/types";

/**
 * Adapter over the existing DeBank implementation. No DeBank logic is duplicated
 * here and none is removed from libs/debank.ts.
 *
 * Because the `Portfolio*` types are aliases of the DeBank shapes, the
 * single-token methods are pass-throughs - there is nothing to translate.
 */
export const debankProvider: PortfolioAPI = {
  name: "debank",

  // debankName is notNull in the schema, so DeBank mode never hides a chain.
  isChainSupported(_chain: ChainMetadata): boolean {
    return true;
  },

  /**
   * DeBank returns every chain in ONE call, so this fan-out carries no extra
   * network cost. Tokens are translated onto the INTERNAL chain name because
   * consumers key off `ChainMetadata.name`, not `debankName`.
   */
  async getAllTokenBalances(
    address: string,
    chains: ChainMetadata[],
  ): Promise<PortfolioToken[]> {
    const debankTokens = await getAllUserTokenList(address);
    const byDebankName = new Map(chains.map((c) => [c.debankName, c]));
    const balances: PortfolioToken[] = [];

    for (const token of debankTokens) {
      const chain = byDebankName.get(token.chain);
      if (!chain) continue;
      // Only configured assets are surfaced, matching the pre-existing
      // behaviour of getBalancesFromDebank.
      const asset = chain.assets.find((a) => a.symbol === token.symbol);
      if (!asset) continue;
      balances.push({
        chain: chain.name,
        balance: (token.amount ?? 0).toString(),
        symbol: asset.symbol,
        usdValue: (token.price ?? 0) * (token.amount ?? 0),
        price: token.price ?? 0,
        isNativeAsset: asset.type === "NATIVE",
      });
    }
    return balances;
  },

  async getTokenList(address: string, chain: ChainMetadata): Promise<PortfolioUserToken[]> {
    const tokens = await getUserTokenList(address, chain.debankName);
    // DeBank's /v1/user/token_list shape (UserTokenInfo) lacks three fields that
    // PortfolioUserToken (= UserTokenBalanceInfo) declares: is_scam,
    // is_suspicious and low_credit_score. No consumer reads them, so
    // they are defaulted here rather than widening the shared alias or casting.
    return tokens.map((token) => ({
      ...token,
      is_scam: false,
      is_suspicious: false,
      low_credit_score: false,
    }));
  },

  async getTokenInfo(chain: ChainMetadata, tokenId: string): Promise<PortfolioTokenInfo> {
    // The shared layer calls this with NATIVE_TOKEN_IDENTIFIER for native
    // assets; DeBank's own convention is the chain name. Translating here keeps
    // that quirk out of aggregate.ts.
    const identifier = tokenId === NATIVE_TOKEN_IDENTIFIER ? chain.debankName : tokenId;
    return debankGetTokenInfo(chain.debankName, identifier);
  },

  async getUserTokenBalanceInfo(
    address: string,
    chain: ChainMetadata,
    tokenId: string,
  ): Promise<PortfolioUserToken> {
    // Symmetric with getTokenInfo above: the shared layer may hand us
    // NATIVE_TOKEN_IDENTIFIER, but DeBank's own convention is the chain name.
    const identifier = tokenId === NATIVE_TOKEN_IDENTIFIER ? chain.debankName : tokenId;
    return debankGetUserTokenBalanceInfo(address, chain.debankName, identifier);
  },
};
