import { getChainMetadata } from "@/database/queries";
import { isProviderOutage } from "@/libs/portfolioAPI/errors";
import { NATIVE_TOKEN_IDENTIFIER } from "@/libs/portfolioAPI/types";
import type { PortfolioAPI, PortfolioToken } from "@/libs/portfolioAPI/types";

/**
 * The DB-metadata-driven aggregation lifted out of `getBalancesFromDebank`.
 *
 * Provider-agnostic on purpose: the matching rules, the native-asset handling
 * and the zero-fill fallback are subtle enough that keeping one copy is the
 * only way both providers stay consistent.
 */
export async function aggregateBalances(
  api: PortfolioAPI,
  address: string,
): Promise<PortfolioToken[]> {
  const chainsMetadata = await getChainMetadata();
  const supported = chainsMetadata.filter((c) => api.isChainSupported(c));

  // Unsupported chains were excluded above, so a failure here is a genuine
  // provider problem rather than "this chain is not configured". It propagates
  // instead of being zero-filled: an outage must never read as "holds nothing".
  //
  // Not every reachable failure is an outage, though: GoldRush rejects the
  // literal zero-address family with a 406, which is neither an outage nor an
  // empty portfolio. No real wallet is that address, so it is left to fail
  // loudly rather than special-cased into a silently zeroed portfolio.
  const providerTokens = await api.getAllTokenBalances(address, supported);

  const byChainAndSymbol = new Map<string, PortfolioToken>();
  for (const token of providerTokens) {
    const key = `${token.chain}::${token.symbol}`;
    // FIRST match wins, deliberately. The code this replaced used `.find()`, so
    // first-wins is the behaviour the 1:1 requirement is measured against; a
    // plain `Map.set` would silently flip the winner to the last match. That
    // matters because a provider can legitimately return two tokens sharing one
    // symbol on a chain (a spoofed token using a real asset's ticker), and the
    // winner decides which balance and price the user sees.
    if (!byChainAndSymbol.has(key)) byChainAndSymbol.set(key, token);
  }

  const balances: PortfolioToken[] = [];
  for (const chainMetadata of supported) {
    for (const asset of chainMetadata.assets) {
      const match = byChainAndSymbol.get(`${chainMetadata.name}::${asset.symbol}`);
      if (match) {
        // Native-ness comes from the CONFIGURED asset, not from whichever
        // provider answered. The two providers derive it from different sources
        // (the DeBank adapter from asset.type, the GoldRush adapter from
        // is_native_token), so trusting the provider's value would make 1:1
        // parity accidental instead of structural. Overriding here is what makes
        // both modes emit identical rows for the same portfolio.
        balances.push({ ...match, isNativeAsset: asset.type === "NATIVE" });
        continue;
      }
      // Pre-existing fallback: configured asset the provider did not return.
      // This is NOT an outage path - an outage propagates above.
      let price = 0;
      try {
        const tokenIdentifier =
          asset.type !== "NATIVE"
            ? (asset.address as string)
            : NATIVE_TOKEN_IDENTIFIER;
        const info = await api.getTokenInfo(chainMetadata, tokenIdentifier);
        price = info.price;
      } catch (e) {
        // ONLY an outage propagates. A per-request 4xx - a 404 for an unknown
        // token on DeBank, a 400 on GoldRush - must keep the pre-existing $0
        // fallback. Using `instanceof PortfolioProviderError` here would also
        // match those, failing the whole page (and, since the gate is
        // fail-closed, locking Positions/Invest/Divest) over one asset the
        // provider does not recognise. That is the I2 defect, which is why the
        // classification lives in one shared function.
        if (isProviderOutage(e)) throw e;
        price = 0;
      }
      balances.push({
        chain: chainMetadata.name,
        balance: "0",
        symbol: asset.symbol,
        usdValue: 0,
        price,
        isNativeAsset: asset.type === "NATIVE",
      });
    }
  }
  return balances;
}
