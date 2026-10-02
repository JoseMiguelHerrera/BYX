import { describe, expect, it, vi } from "vitest";
import { aggregateBalances } from "@/libs/portfolioAPI/aggregate";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { getChainMetadata } from "@/database/queries";
import type { ChainMetadata, PortfolioAPI, PortfolioToken } from "@/libs/portfolioAPI/types";

// REQUIRED: aggregateBalances calls getChainMetadata(), which opens a real
// Postgres connection via getDB(). Without this mock the test requires a live
// database, which is unacceptable for a unit test.
vi.mock("@/database/queries", () => ({
  getChainMetadata: vi.fn(async () => [
    {
      id: "ethereum",
      name: "Ethereum",
      debankName: "eth",
      assets: [
        {
          id: "asset-eth",
          name: "Ether",
          symbol: "ETH",
          type: "NATIVE",
          address: null,
          decimals: 18,
          isFundingAsset: false,
          priceUSD: 0,
        },
        {
          id: "asset-usdc",
          name: "USD Coin",
          symbol: "USDC",
          type: "ERC20",
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          decimals: 6,
          isFundingAsset: false,
          priceUSD: 0,
        },
      ],
    },
  ]),
}));

function makeApi(overrides: Partial<PortfolioAPI> = {}): PortfolioAPI {
  return {
    name: "goldrush",
    isChainSupported: () => true,
    getAllTokenBalances: async (_address: string, _chains: ChainMetadata[]) => [],
    getTokenList: async () => [],
    getTokenInfo: async () => ({
      id: "x", chain: "c", name: "n", symbol: "s", decimals: 18, price: 1,
      display_symbol: null, optimized_symbol: "s", logo_url: "",
      protocol_id: "", is_verified: false, is_core: false, is_wallet: false, time_at: 0,
    }),
    getUserTokenBalanceInfo: async () => {
      throw new Error("not used");
    },
    ...overrides,
  };
}

describe("aggregateBalances", () => {
  it("returns held tokens for supported chains", async () => {
    const held: PortfolioToken = {
      chain: "Ethereum", balance: "1.5", symbol: "ETH",
      usdValue: 3000, price: 2000, isNativeAsset: true,
    };
    const api = makeApi({
      getAllTokenBalances: async (_address: string, _chains: ChainMetadata[]) => [held],
    });
    const out = await aggregateBalances(api, "0xabc");
    // USDC is configured but not held, so it is zero-filled by the fallback
    // (covered by its own test). Here we only assert the held token is returned
    // verbatim.
    expect(out.find((t) => t.symbol === "ETH")).toEqual(held);
  });

  it("takes isNativeAsset from the configured asset, not the provider's claim", async () => {
    // The two providers derive native-ness from different sources (DeBank from
    // asset.type, GoldRush from is_native_token). If the aggregator passed the
    // provider's value through, a provider could disagree with the config and
    // the two modes would render different rows for the same portfolio. This
    // test forces the config to win.
    const held: PortfolioToken = {
      chain: "Ethereum", balance: "1.5", symbol: "ETH",
      usdValue: 3000, price: 2000, isNativeAsset: false, // deliberately wrong
    };
    const api = makeApi({
      getAllTokenBalances: async (_address: string, _chains: ChainMetadata[]) => [held],
    });
    const out = await aggregateBalances(api, "0xabc");
    expect(out.find((t) => t.symbol === "ETH")!.isNativeAsset).toBe(true);
  });

  it("emits a zero-balance row for a configured asset the provider did not return", async () => {
    // USDC is configured but absent from the provider result, so it must fall
    // back to a $0 row priced via getTokenInfo - the pre-existing behaviour.
    const api = makeApi({ getTokenInfo: async () => ({
      id: "x", chain: "Ethereum", name: "USD Coin", symbol: "USDC", decimals: 6, price: 1,
      display_symbol: null, optimized_symbol: "USDC", logo_url: "",
      protocol_id: "", is_verified: false, is_core: false, is_wallet: false, time_at: 0,
    }) });
    const out = await aggregateBalances(api, "0xabc");
    const usdc = out.find((t) => t.symbol === "USDC");
    expect(usdc).toBeDefined();
    expect(usdc!.balance).toBe("0");
    expect(usdc!.usdValue).toBe(0);
    expect(usdc!.price).toBe(1);
    expect(usdc!.isNativeAsset).toBe(false);
  });

  it("propagates a provider outage instead of returning a partial portfolio", async () => {
    const api = makeApi({
      getAllTokenBalances: async () => {
        throw new PortfolioProviderError("upstream 403", { providerStatus: 403 });
      },
    });
    await expect(aggregateBalances(api, "0xabc")).rejects.toBeInstanceOf(
      PortfolioProviderError,
    );
  });

  it("treats a per-request 4xx from getTokenInfo as a $0 row, not an outage", async () => {
    // Pre-existing behaviour, and the I2 fix: an asset the provider does not
    // recognise must NOT fail the page. A 404 on DeBank (a 400 on GoldRush) is one
    // bad request. Because the availability gate is fail-closed, propagating it
    // would lock Positions/Invest/Divest persistently over a single unknown asset.
    const api = makeApi({
      getTokenInfo: async () => {
        throw new PortfolioProviderError("... failed with status 404", {
          providerStatus: 404,
        });
      },
    });
    const out = await aggregateBalances(api, "0xabc");
    const usdc = out.find((t) => t.symbol === "USDC")!;
    expect(usdc).toBeDefined();
    expect(usdc.balance).toBe("0");
    expect(usdc.price).toBe(0); // unpriced, but the page still renders
  });

  it("still propagates a 5xx from getTokenInfo as an outage", async () => {
    // The counterpart to the test above: the classifier must not become so
    // permissive that a real outage is downgraded to a $0 row.
    const api = makeApi({
      getTokenInfo: async () => {
        throw new PortfolioProviderError("... failed with status 503", {
          providerStatus: 503,
        });
      },
    });
    await expect(aggregateBalances(api, "0xabc")).rejects.toBeInstanceOf(
      PortfolioProviderError,
    );
  });

  it("only iterates chains the provider supports, and drops their assets", async () => {
    // Two chains, one supported and one not. The earlier version of this test used a
    // single-chain mock, so it stayed green even with the filter deleted - mutation
    // testing caught that the assertion could not fail. A second chain whose asset
    // must NOT appear makes the removal observable.
    vi.mocked(getChainMetadata).mockResolvedValueOnce([
      {
        id: "ethereum",
        name: "Ethereum",
        debankName: "eth",
        assets: [
          {
            id: "asset-eth",
            name: "Ether",
            symbol: "ETH",
            type: "NATIVE",
            address: null,
            decimals: 18,
            isFundingAsset: false,
            priceUSD: 0,
          },
        ],
      },
      {
        id: "berachain",
        name: "Berachain",
        debankName: "berachain",
        assets: [
          {
            id: "asset-bera",
            name: "Bera",
            symbol: "BERA",
            type: "NATIVE",
            address: null,
            decimals: 18,
            isFundingAsset: false,
            priceUSD: 0,
          },
        ],
      },
    ] as never);

    const seen: string[] = [];
    const api = makeApi({
      isChainSupported: (c: ChainMetadata) => c.id === "ethereum",
      getAllTokenBalances: async (_address: string, chains: ChainMetadata[]) => {
        seen.push(...chains.map((c) => c.id));
        return chains.map((c) => ({
          chain: c.name, balance: "1", symbol: c.assets[0]!.symbol,
          usdValue: 1, price: 1, isNativeAsset: true,
        }));
      },
    });

    const out = await aggregateBalances(api, "0xabc");

    expect(seen).toEqual(["ethereum"]);
    expect(out.map((t) => t.symbol)).toContain("ETH");
    expect(out.map((t) => t.symbol)).not.toContain("BERA");
  });

  it("keeps the FIRST token when two share a chain and symbol", async () => {
    // Providers can return two tokens with one symbol on a chain - a spoofed
    // token reusing a real asset's ticker is the realistic case. The
    // implementation this replaced used `.find()`, i.e. first-match-wins; a
    // plain `Map.set` would silently invert the winner to the last match and
    // change which balance the user sees. This pins the original behaviour.
    const first: PortfolioToken = {
      chain: "Ethereum", balance: "1", symbol: "ETH",
      usdValue: 2000, price: 2000, isNativeAsset: true,
    };
    const second: PortfolioToken = {
      chain: "Ethereum", balance: "999999", symbol: "ETH",
      usdValue: 1999998000, price: 2000, isNativeAsset: false,
    };
    const api = makeApi({
      getAllTokenBalances: async (_address: string, _chains: ChainMetadata[]) => [first, second],
    });
    const out = await aggregateBalances(api, "0xabc");
    const eth = out.filter((t) => t.symbol === "ETH");
    expect(eth).toHaveLength(1);
    const winner = eth[0];
    if (!winner) throw new Error("expected exactly one ETH row");
    expect(winner.balance).toBe("1");
    expect(winner.usdValue).toBe(2000);
  });
});
