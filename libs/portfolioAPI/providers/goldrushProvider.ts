import type {
  ChainMetadata,
  PortfolioAPI,
  PortfolioToken,
  PortfolioTokenInfo,
  PortfolioUserToken,
} from "@/libs/portfolioAPI/types";
import { NATIVE_TOKEN_IDENTIFIER } from "@/libs/portfolioAPI/types";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { goldrushGet } from "@/libs/portfolioAPI/providers/goldrushClient";
import { resolveGoldrushSlug } from "@/libs/portfolioAPI/providers/goldrushChains";
import { mergeLlamaFallback, resolveLlamaSlug } from "@/libs/portfolioAPI/providers/defillamaPricing";

/** GoldRush spells the native asset with this placeholder, not a null address. */
const NATIVE_PLACEHOLDER_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

interface GoldrushItem {
  contract_decimals: number | null;
  contract_name: string | null;
  contract_ticker_symbol: string | null;
  contract_address: string | null;
  is_native_token: boolean | null;
  is_spam: boolean | null;
  balance: string | null;
  quote_rate: number | null;
  quote: number | null;
}

interface GoldrushBalances {
  items?: GoldrushItem[];
}

interface GoldrushPriceEntry {
  contract_address: string;
  contract_decimals: number | null;
  contract_name: string | null;
  contract_ticker_symbol: string | null;
  /** Present when ONE address was requested. */
  prices?: { price: number | null }[];
  /** Present when MULTIPLE addresses were requested. The API is inconsistent here. */
  items?: { price: number | null }[];
}

/**
 * GoldRush reports balances in RAW base units; consumers require human units
 * (the engine multiplies amount by price). Verified against live
 * prices: ETH 5715987139328012679 / 10**18 * 2666.727 = $15,242.98.
 */
export function toHumanAmount(balance: string | null, decimals: number | null): number {
  if (!balance) return 0;
  const raw = Number(balance);
  if (!Number.isFinite(raw)) return 0;
  const d = typeof decimals === "number" ? decimals : 0;
  const value = raw / 10 ** d;
  return Number.isFinite(value) ? value : 0;
}

/** Exported for tests: `prices` and `items` are both observed, depending on arity. */
export function priceOf(entry: GoldrushPriceEntry): number {
  const arr = entry.prices ?? entry.items ?? [];
  const p = arr[0]?.price;
  return typeof p === "number" && Number.isFinite(p) ? p : 0;
}

/**
 * Base-unit hex for a raw balance string.
 *
 * Derived from the STRING via BigInt, not from the Number conversion. Raw balances
 * routinely exceed Number.MAX_SAFE_INTEGER - a real 24-decimal balance did - and
 * `Math.trunc(Number(balance)).toString(16)` silently corrupts the low digits
 * (measured off by 527,945,491 on that balance, turning `…c9f77cf13` into
 * `…c80000000`). DeBank computes this field server-side from the exact integer, so
 * deriving it from a float would diverge from the field it is meant to mirror.
 *
 * `raw_amount` itself stays a `number` because the shared type declares one, and
 * there it is harmless: DeBank's own JSON number is the same IEEE-754 double, so
 * the two agree bit-for-bit.
 */
export function rawAmountHex(balance: string | null): string {
  if (!balance || !/^\d+$/.test(balance)) return "0x0";
  return `0x${BigInt(balance).toString(16)}`;
}

/**
 * A "chain not supported" 501/552 is a static support fact, not an outage.
 * Treating it as an outage would trip the fail-closed gate for the whole app,
 * because isProviderOutage() classifies status >= 500 as an outage.
 */
function isUnsupportedChainError(error: unknown): boolean {
  if (!(error instanceof PortfolioProviderError)) return false;
  const s = error.providerStatus;
  if (s !== 501 && s !== 552) return false;
  return /not supported/i.test(error.message);
}

function toPortfolioToken(
  item: GoldrushItem,
  chainName: string,
  price: number,
): PortfolioToken {
  const decimals = item.contract_decimals ?? 0;
  const amount = toHumanAmount(item.balance, decimals);
  return {
    chain: chainName,
    balance: amount.toString(),
    symbol: item.contract_ticker_symbol ?? "",
    // balances_v2 has no quote, so this is computed - same as debank.ts:222.
    usdValue: amount * price,
    price,
    isNativeAsset: item.is_native_token === true,
  };
}

function toPortfolioUserToken(
  item: GoldrushItem,
  chainName: string,
  price: number,
): PortfolioUserToken {
  const decimals = item.contract_decimals ?? 0;
  const symbol = item.contract_ticker_symbol ?? "";
  const rawAmount = Number(item.balance ?? 0);
  return {
    id: item.contract_address ?? "",
    chain: chainName,
    name: item.contract_name ?? "",
    symbol,
    price,
    decimals,
    amount: toHumanAmount(item.balance, decimals),
    raw_amount: rawAmount,
    raw_amount_hex_str: rawAmountHex(item.balance),
    // GoldRush has no equivalent for these DeBank-only fields. Set explicitly so
    // the alias to UserTokenBalanceInfo stays honest. `is_scam` is the
    // one with a real signal behind it.
    display_symbol: null,
    optimized_symbol: symbol,
    logo_url: null,
    protocol_id: "",
    price_24h_change: null,
    credit_score: 0,
    is_verified: false,
    is_scam: item.is_spam === true,
    is_suspicious: false,
    is_core: null,
    is_wallet: false,
    time_at: 0,
    low_credit_score: false,
  };
}

/** A zeroed record for a token the user does not hold, preserving DeBank behaviour. */
function zeroUserToken(chain: ChainMetadata, tokenId: string): PortfolioUserToken {
  return toPortfolioUserToken(
    {
      contract_decimals: 0, contract_name: "", contract_ticker_symbol: "",
      contract_address: tokenId, is_native_token: null, is_spam: null,
      balance: "0", quote_rate: null, quote: null,
    },
    chain.name,
    0,
  );
}

/**
 * A zeroed price record for a chain GoldRush reports as unsupported.
 *
 * The static `supportedByGoldrush` flag is the primary defence, so this is
 * defence in depth: without it a stale flag would surface as a provider error,
 * and isProviderOutage classifies >= 500 as an outage, hiding the whole portfolio
 * instead of one chain.
 */
function zeroTokenInfo(chain: ChainMetadata, tokenId: string): PortfolioTokenInfo {
  return {
    id: tokenId,
    chain: chain.name,
    name: "",
    symbol: "",
    display_symbol: null,
    optimized_symbol: "",
    decimals: 0,
    logo_url: "",
    protocol_id: "",
    price: 0,
    is_verified: false,
    is_core: false,
    is_wallet: false,
    time_at: 0,
  };
}

/**
 * True when the caller is asking for the chain's native asset.
 *
 * Two spellings reach us: the shared layer passes NATIVE_TOKEN_IDENTIFIER, and
 * the engine passes the chain's DeBank name (tokenConsumptionEngine.ts:261,
 * consumeCrossChainTokens.ts:96, index.ts:47). Both must resolve native or
 * native-asset trades break.
 */
function isNativeRequest(chain: ChainMetadata, tokenId: string): boolean {
  return tokenId === NATIVE_TOKEN_IDENTIFIER || tokenId === chain.debankName;
}

function findNativeItem(items: GoldrushItem[]): GoldrushItem | undefined {
  return items.find((i) => i.is_native_token === true);
}

/**
 * Bulk price lookup, keyed lowercase by address.
 *
 * Two hard limits were observed against the live API, and BOTH must be handled:
 *
 * 1. URL length. 100 addresses in the path segment (4352 chars) returns 200;
 *    200 (8652 chars) returns **414 URI Too Long**. `getTokenList` asks to price
 *    every token a wallet holds (3389 for the reference wallet), so this MUST chunk.
 * 2. One unknown address poisons the WHOLE request. GoldRush returns
 *    `400 "Contract address '0x…' not found!"` if ANY address is unknown to its
 *    pricing DB, discarding the valid entries in the same request. A wallet
 *    holding a single spam / brand-new / self-destructed token would otherwise
 *    fail the entire positions page. This MUST be isolated.
 *
 * Chunks are issued sequentially, not with Promise.all: a large wallet would
 * otherwise fire dozens of simultaneous requests and invite a 429, which the
 * shared layer correctly treats as a provider outage. Measured: 20 sequential
 * calls produced no 429 and a 53ms median, so serial is cheap here.
 */
const PRICING_CHUNK_SIZE = 50;

/**
 * A 400 "… not found!" is a per-address miss - not an outage.
 *
 * Genuine failures (401/403/429/5xx/timeout) must NOT be treated as one: bisecting
 * an outage would fire dozens of doomed requests and then report price 0 instead
 * of failing closed.
 */
function isUnknownAddressError(error: unknown): boolean {
  return (
    error instanceof PortfolioProviderError &&
    error.providerStatus === 400 &&
    /not found/i.test(error.message)
  );
}

async function fetchPriceChunk(
  slug: string,
  addresses: string[],
  out: Map<string, number>,
): Promise<void> {
  try {
    const data = await goldrushGet<GoldrushPriceEntry[]>(
      `/pricing/historical_by_addresses_v2/${slug}/USD/${addresses.join(",")}/`,
    );
    for (const entry of data ?? []) {
      out.set((entry.contract_address ?? "").toLowerCase(), priceOf(entry));
    }
  } catch (error) {
    if (!isUnknownAddressError(error)) throw error; // real outage: propagate
    if (addresses.length === 1) return; // unpriceable: left absent => price 0
    // Bisect to isolate the offending address(es) while keeping the valid ones.
    const mid = Math.ceil(addresses.length / 2);
    await fetchPriceChunk(slug, addresses.slice(0, mid), out);
    await fetchPriceChunk(slug, addresses.slice(mid), out);
  }
}

async function fetchPrices(
  slug: string,
  addresses: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))].filter(Boolean);
  for (let i = 0; i < unique.length; i += PRICING_CHUNK_SIZE) {
    await fetchPriceChunk(slug, unique.slice(i, i + PRICING_CHUNK_SIZE), map);
  }
  return map;
}

/**
 * Seed prices from balances_v2's inline `quote_rate`, for the addresses actually
 * asked about, wherever the authoritative pricing endpoint had no answer.
 *
 * Verified live: quote_rate is USD per token on the same scale as the pricing
 * endpoint (ETH 2668.7383 inline vs 2670.1157 from /pricing/, minutes apart), and
 * balances_v2 carries it for a subset of tokens (435/3389 on the reference
 * wallet). It is GoldRush's own number and costs no extra request, and it covers
 * tokens the pricing endpoint rejects with a 400 - so it is preferred over
 * DefiLlama, which merges afterwards and only fills what is still unpriced.
 *
 * Restricted to `addresses` deliberately: pricing tokens nobody asked about would
 * change the shape of the returned portfolio.
 */
function withInlineRates(
  items: GoldrushItem[],
  addresses: string[],
  prices: Map<string, number>,
): Map<string, number> {
  const merged = new Map(prices);
  const wanted = new Set(addresses.map((a) => a.toLowerCase()));
  for (const item of items) {
    const address = (item.contract_address ?? "").toLowerCase();
    if (!address || !wanted.has(address)) continue;
    if ((merged.get(address) ?? 0) > 0) continue;
    const inline = item.quote_rate;
    if (typeof inline === "number" && Number.isFinite(inline) && inline > 0) {
      merged.set(address, inline);
    }
  }
  return merged;
}

export const goldrushProvider: PortfolioAPI = {
  name: "goldrush",

  isChainSupported(chain: ChainMetadata): boolean {
    return chain.supportedByGoldrush === true;
  },

  /**
   * Two calls per chain: balances_v2 (which carries NO prices), then one bulk
   * pricing call for the addresses we care about.
   *
   * Promise.all is deliberate: statically unsupported chains are filtered out
   * before this is reached, so a rejection here is a genuine outage and must
   * propagate rather than yield a quietly smaller portfolio. The one exception
   * is a "chain not supported" 501/552, which is a support fact, not an outage.
   */
  async getAllTokenBalances(
    address: string,
    chains: ChainMetadata[],
  ): Promise<PortfolioToken[]> {
    const perChain = await Promise.all(
      chains.map(async (chain) => {
        const slug = resolveGoldrushSlug(chain);
        if (!slug) return [];
        try {
          const data = await goldrushGet<GoldrushBalances>(
            `/${slug}/address/${address}/balances_v2/?no-spam=true`,
          );
          const items = (data.items ?? []).filter((i) => i.is_spam !== true);

          // Only configured assets need prices, so the pricing call stays small
          // even for a wallet holding thousands of tokens.
          const wanted = items.filter((i) =>
            chain.assets.some((a) => a.symbol === i.contract_ticker_symbol),
          );
          const addresses = [
            ...new Set(
              wanted
                .map((i) => i.contract_address)
                .filter((a): a is string => Boolean(a)),
            ),
          ];
          const prices = await fetchPrices(slug, addresses);
          // Configured assets the pricing endpoint left unpriced are topped up:
          // first from balances_v2's own inline quote_rate, then from DefiLlama,
          // which also covers pool shares (Uniswap V2 UNI-V2, berachain Islands).
          const priced = await mergeLlamaFallback(
            resolveLlamaSlug(chain),
            addresses,
            withInlineRates(items, addresses, prices),
          );

          return items.map((i) =>
            toPortfolioToken(
              i,
              chain.name,
              priced.get((i.contract_address ?? "").toLowerCase()) ?? 0,
            ),
          );
        } catch (e) {
          if (isUnsupportedChainError(e)) return [];
          throw e;
        }
      }),
    );
    return perChain.flat();
  },

  async getTokenList(
    address: string,
    chain: ChainMetadata,
  ): Promise<PortfolioUserToken[]> {
    const slug = resolveGoldrushSlug(chain);
    if (!slug) return [];
    let data: GoldrushBalances;
    try {
      data = await goldrushGet<GoldrushBalances>(
        `/${slug}/address/${address}/balances_v2/?no-spam=true`,
      );
    } catch (e) {
      // A static "chain not supported" is a support fact, not an outage: returning
      // [] hides the chain, whereas propagating would trip the fail-closed gate for
      // every chain.
      if (isUnsupportedChainError(e)) return [];
      throw e;
    }
    const items = (data.items ?? []).filter((i) => i.is_spam !== true);
    const addresses = [
      ...new Set(
        items.map((i) => i.contract_address).filter((a): a is string => Boolean(a)),
      ),
    ];
    const prices = await fetchPrices(slug, addresses);
    // This is the positions path: a pool share left at price 0 would be dropped
    // entirely by getUserPosition's `price > 0` filter, so the fallback matters
    // most here.
    const priced = await mergeLlamaFallback(
      resolveLlamaSlug(chain),
      addresses,
      withInlineRates(items, addresses, prices),
    );
    return items.map((i) =>
      toPortfolioUserToken(
        i,
        chain.name,
        priced.get((i.contract_address ?? "").toLowerCase()) ?? 0,
      ),
    );
  },

  /**
   * Price and metadata for one token, possibly not held.
   *
   * Uses the PRICING endpoint, not balances_v2 and not the (nonexistent)
   * `/v1/{chain}/tokens/{addr}/`. The native sentinel maps to `0xeeee...eeee`
   * here, which is why this needs no address parameter, for all three engine
   * call sites.
   */
  async getTokenInfo(chain: ChainMetadata, tokenId: string): Promise<PortfolioTokenInfo> {
    const slug = resolveGoldrushSlug(chain);
    if (!slug) {
      throw new Error(
        `GoldRush does not support chain ${chain.name}; caller must not request it`,
      );
    }
    const lookup = isNativeRequest(chain, tokenId) ? NATIVE_PLACEHOLDER_ADDRESS : tokenId;
    let entry: GoldrushPriceEntry | undefined;
    try {
      const data = await goldrushGet<GoldrushPriceEntry[]>(
        `/pricing/historical_by_addresses_v2/${slug}/USD/${lookup}/`,
      );
      entry = (data ?? [])[0];
    } catch (error) {
      // A static "chain not supported" is a support fact, not an outage. Returning a
      // zeroed record hides the chain instead of tripping the fail-closed gate for
      // the whole app.
      if (isUnsupportedChainError(error)) return zeroTokenInfo(chain, tokenId);
      // A 400 "Contract address ... not found!" is a per-token miss, not an outage:
      // GoldRush's pricing database does not know the token. It must not abort the
      // request, because an unknown token is precisely the case DefiLlama covers.
      if (!isUnknownAddressError(error)) throw error;
    }
    const symbol = entry?.contract_ticker_symbol ?? "";
    // A token absent from the price database is not an error - price 0 and let
    // the caller decide, matching DeBank's behaviour for unknown tokens. The
    // fallback covers pool shares GoldRush cannot price at all, which is what the
    // engine's $0 LP leg was caused by.
    const priced = await mergeLlamaFallback(
      resolveLlamaSlug(chain),
      [lookup],
      new Map([[lookup.toLowerCase(), entry ? priceOf(entry) : 0]]),
    );
    return {
      id: entry?.contract_address ?? tokenId,
      chain: chain.name,
      name: entry?.contract_name ?? "",
      symbol,
      // Decimals come from the pricing response, which consumeCrossChainTokens.ts:96 needs.
      decimals: entry?.contract_decimals ?? 0,
      price: priced.get(lookup.toLowerCase()) ?? 0,
      display_symbol: null,
      optimized_symbol: symbol,
      logo_url: "",
      protocol_id: "",
      is_verified: false,
      is_core: false,
      is_wallet: false,
      time_at: 0,
    };
  },

  async getUserTokenBalanceInfo(
    address: string,
    chain: ChainMetadata,
    tokenId: string,
  ): Promise<PortfolioUserToken> {
    const slug = resolveGoldrushSlug(chain);
    if (!slug) {
      throw new Error(
        `GoldRush does not support chain ${chain.name}; caller must not request it`,
      );
    }
    let data: GoldrushBalances;
    try {
      data = await goldrushGet<GoldrushBalances>(
        `/${slug}/address/${address}/balances_v2/?no-spam=true`,
      );
    } catch (e) {
      // Support fact, not an outage: a zeroed row keeps one mis-flagged chain from
      // hiding every chain.
      if (isUnsupportedChainError(e)) return zeroUserToken(chain, tokenId);
      throw e;
    }
    // Per-item spam guard, kept consistent with getAllTokenBalances/getTokenList;
    // the redundancy is load-bearing.
    const items = (data.items ?? []).filter((i) => i.is_spam !== true);
    const match = isNativeRequest(chain, tokenId)
      ? findNativeItem(items)
      : items.find(
          (i) => (i.contract_address ?? "").toLowerCase() === tokenId.toLowerCase(),
        );
    // A token the user does not hold is NOT an error: index.ts:49 takes a
    // pre/post trade snapshot and expects a zero amount, as DeBank returned.
    if (!match) return zeroUserToken(chain, tokenId);
    const tokenAddress = (match.contract_address ?? "").toLowerCase();
    const prices = await fetchPrices(slug, [tokenAddress]);
    const priced = await mergeLlamaFallback(
      resolveLlamaSlug(chain),
      [tokenAddress],
      withInlineRates([match], [tokenAddress], prices),
    );
    return toPortfolioUserToken(match, chain.name, priced.get(tokenAddress) ?? 0);
  },
};
