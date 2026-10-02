import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { NATIVE_TOKEN_IDENTIFIER } from "@/libs/portfolioAPI/types";
import type { ChainMetadata } from "@/libs/portfolioAPI/types";
import { priceOf, rawAmountHex, toHumanAmount } from "@/libs/portfolioAPI/providers/goldrushProvider";

// A single hoisted mock for the transport, configured per test. This replaces
// the brief's `vi.doMock` + `vi.resetModules` pattern: resetModules re-evaluates
// `errors.ts`, giving the provider a DIFFERENT `PortfolioProviderError` class
// identity than the one the test constructs, so `error instanceof
// PortfolioProviderError` would be false and the 400-bisect path would silently
// stop working (the error would propagate instead of being isolated). A single
// module instance keeps the class identity stable.
const { goldrushGetMock } = vi.hoisted(() => ({ goldrushGetMock: vi.fn() }));

vi.mock("@/libs/portfolioAPI/providers/goldrushClient", () => ({
  goldrushGet: goldrushGetMock,
}));

// The DefiLlama fallback shares the provider's pricing path, so it must be mocked
// here too - otherwise every zero-priced fixture would fire a real network request
// and make these assertions depend on the live API.
const { llamaGetMock } = vi.hoisted(() => ({ llamaGetMock: vi.fn() }));

vi.mock("@/libs/portfolioAPI/providers/defillamaClient", () => ({
  llamaGet: llamaGetMock,
}));

import { goldrushProvider } from "@/libs/portfolioAPI/providers/goldrushProvider";

const GOLDRUSH_FIXTURES = path.resolve(
  fileURLToPath(new URL("../__fixtures__/goldrush", import.meta.url)),
);

const ETH_CHAIN: ChainMetadata = {
  id: "ethereum",
  name: "Ethereum",
  debankName: "eth",
  goldrushName: "eth-mainnet",
  supportedByGoldrush: true,
  defillamaName: "ethereum",
  assets: [],
};

const BASE_SEPOLIA_CHAIN: ChainMetadata = {
  id: "base-sepolia",
  name: "Base Sepolia",
  debankName: "base-sepolia",
  goldrushName: "base-sepolia",
  supportedByGoldrush: true,
  assets: [],
};

beforeEach(() => {
  goldrushGetMock.mockReset();
  llamaGetMock.mockReset();
  // Default: DefiLlama knows nothing, so GoldRush's result passes through unchanged.
  llamaGetMock.mockResolvedValue({ coins: {} });
});

describe("toHumanAmount", () => {
  it("converts raw base units to a human-readable number", () => {
    expect(toHumanAmount("1500000000000000000", 18)).toBe(1.5);
  });

  it("handles 6-decimal tokens (USDC)", () => {
    expect(toHumanAmount("2500000", 6)).toBe(2.5);
  });

  it("stays sane for a large raw value instead of leaking wei", () => {
    const out = toHumanAmount("1234567890123456789", 18);
    expect(out).toBeLessThan(1e6);
  });

  it("returns 0 for a zero balance", () => {
    expect(toHumanAmount("0", 18)).toBe(0);
  });

  it("normalizes a null balance to 0 rather than NaN", () => {
    expect(toHumanAmount(null, 18)).toBe(0);
  });

  it("returns 0 for a non-numeric balance string instead of NaN", () => {
    // The `Number.isFinite(value) ? value : 0` guard exists for exactly this input.
    // Without it a malformed balance becomes NaN, which propagates into usdValue and
    // breaks every downstream numeric invariant. The null case above does NOT cover
    // it: Number(null ?? 0) is a finite 0, so that test passes either way.
    for (const bad of ["abc", "1.2.3", "not-a-number"]) {
      expect(toHumanAmount(bad, 18)).toBe(0);
    }
  });

  it("returns 0 when decimals would underflow the divisor to zero", () => {
    // Pins the SECOND finite-guard (on `value`, not `raw`). The malformed-string test
    // above cannot reach it: those inputs are already rejected by the guard on `raw`.
    // Only a non-positive `decimals` gets here, because 10 ** -1000 underflows to 0 and
    // raw / 0 is Infinity. GoldRush cannot return a negative contract_decimals, so this
    // is defensive - but the parameter type permits it, and mutation testing showed the
    // guard survived the whole suite while untested.
    expect(toHumanAmount("1000000000000000000", -1000)).toBe(0);
  });
});

describe("rawAmountHex (exact base-unit hex)", () => {
  // The balance that motivated this helper: a real 24-decimal token holding.
  // Number() cannot represent it (527,945,491 lost), so a float-derived hex is
  // wrong in its low digits while DeBank's server-side hex is exact.
  const HUGE = "14572032661869284250078995";

  it("reproduces the exact integer above Number.MAX_SAFE_INTEGER", () => {
    expect(rawAmountHex(HUGE)).toBe("0xc0dbf7935c02c9f77cf13");
  });

  it("differs from the lossy float-derived hex it replaced", () => {
    const lossy = `0x${Math.trunc(Number(HUGE)).toString(16)}`;
    expect(lossy).toBe("0xc0dbf7935c02c80000000");
    expect(rawAmountHex(HUGE)).not.toBe(lossy);
  });

  it("matches the float path for fixture-scale values that round-trip exactly", () => {
    // These must be unchanged: this is a precision fix, not a reformat. Note
    // 1.78e16 also exceeds MAX_SAFE_INTEGER but is still even, so it round-trips.
    for (const v of ["0", "3", "5512815", "17800000000000000"]) {
      expect(rawAmountHex(v)).toBe(`0x${Math.trunc(Number(v)).toString(16)}`);
    }
  });

  it("is exact for the 18-decimal TUSD fixture value", () => {
    expect(rawAmountHex("21709487132565774000")).toBe("0x12d479786787f1eb0");
  });

  it("maps null and malformed input to 0x0 instead of throwing", () => {
    for (const bad of [null, "", "not-a-number", "1.5", "-5"]) {
      expect(rawAmountHex(bad)).toBe("0x0");
    }
  });
});

// The subset of a `balances_v2` item these fixture assertions read. Typing the
// parsed JSON keeps the assertions honest: a typo in a field name is a compile
// error rather than a silent `undefined`.
type FixtureBalanceItem = {
  is_native_token: boolean;
  contract_address: string;
  contract_decimals: number;
  balance: string;
};

describe("goldrushProvider field mapping (fixtures)", () => {
  it("enforces the raw-balance invariant against the real fixture", () => {
    const balances: FixtureBalanceItem[] = JSON.parse(
      fs.readFileSync(path.join(GOLDRUSH_FIXTURES, "eth-mainnet-balances.json"), "utf8"),
    ).data.items;
    const pricing = JSON.parse(
      fs.readFileSync(path.join(GOLDRUSH_FIXTURES, "eth-mainnet-pricing.json"), "utf8"),
    ).data;

    const priceByAddr = new Map<string, number>();
    for (const p of pricing) {
      const entry = (p.items ?? p.prices ?? [])[0];
      if (entry?.price != null) {
        priceByAddr.set(p.contract_address.toLowerCase(), entry.price);
      }
    }

    // ETH is the decisive case: 5715987139328012679 raw / 10**18 * 2666.727
    // = $15,242.98. Read as decimal it would be $1.52e+22.
    const eth = balances.find((i) => i.is_native_token === true);
    if (!eth) throw new Error("fixture is missing its native ETH entry");
    const price = priceByAddr.get(eth.contract_address.toLowerCase());
    if (price === undefined) throw new Error("fixture is missing the ETH price");

    const amount = toHumanAmount(eth.balance, eth.contract_decimals);
    expect(amount).toBeCloseTo(5.715987139328013, 6);
    expect(amount).toBeLessThan(1e6);
    expect(amount * price).toBeCloseTo(15242.98, 0);
  });

  it("native fixture uses the 0xeeee placeholder, not a null address", () => {
    const balances: FixtureBalanceItem[] = JSON.parse(
      fs.readFileSync(path.join(GOLDRUSH_FIXTURES, "eth-mainnet-balances.json"), "utf8"),
    ).data.items;
    const eth = balances.find((i) => i.is_native_token === true);
    if (!eth) throw new Error("fixture is missing its native ETH entry");
    expect(eth.contract_address).toBe("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  });

  it("parses both pricing response shapes (prices vs items)", () => {
    // The API returned `prices` for a 1-address request and `items` for a
    // 3-address request. Both must yield a price.
    const oneAddr = {
      contract_address: "0xabc",
      contract_decimals: 6,
      contract_name: "X",
      contract_ticker_symbol: "X",
      prices: [{ price: 1.23 }],
    };
    const manyAddr = {
      contract_address: "0xabc",
      contract_decimals: 6,
      contract_name: "X",
      contract_ticker_symbol: "X",
      items: [{ price: 1.23 }],
    };
    expect(priceOf(oneAddr)).toBe(1.23);
    expect(priceOf(manyAddr)).toBe(1.23);
  });

  it("treats a token with no price as 0 rather than failing", () => {
    const none = {
      contract_address: "0xabc",
      contract_decimals: 6,
      contract_name: "X",
      contract_ticker_symbol: "X",
      items: [],
    };
    expect(priceOf(none)).toBe(0);
  });

  it("chunks pricing requests so a large token list cannot 414", async () => {
    // Observed live: 100 addresses in the path (4352 chars) -> 200, but 200
    // addresses (8652 chars) -> 414 URI Too Long. getTokenList asks to price
    // every token the wallet holds, so an unchunked request fails on large wallets.
    const items = Array.from({ length: 130 }, (_, i) => ({
      contract_decimals: 18,
      contract_name: `T${i}`,
      contract_ticker_symbol: `T${i}`,
      contract_address: `0x${(i + 1).toString(16).padStart(40, "0")}`,
      is_native_token: false,
      is_spam: false,
      balance: "1000000000000000000",
      quote_rate: null,
      quote: null,
    }));
    const pricingUrls: string[] = [];
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (!p.includes("/pricing/")) return { items };
      pricingUrls.push(p);
      const addrs = p.split("/USD/")[1]!.replace(/\/$/, "").split(",");
      return addrs.map((a) => ({
        contract_address: a,
        contract_decimals: 18,
        contract_name: "x",
        contract_ticker_symbol: "x",
        items: [{ price: 2 }],
      }));
    });

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    // 130 addresses at 50 per chunk => 3 sequential calls, each well under the limit.
    expect(pricingUrls.length).toBe(3);
    for (const url of pricingUrls) expect(url.length).toBeLessThan(5000);
    // The join still succeeded across every chunk, so chunking lost no prices.
    expect(out.length).toBe(130);
    expect(out.every((t) => t.price === 2)).toBe(true);
  });

  it("isolates an unpriceable address instead of failing the whole list", async () => {
    // Observed live: GoldRush 400s the ENTIRE pricing request when ANY address is
    // unknown to its database ("Contract address '0x…' not found!"), discarding the
    // valid entries too. One spam token must not take down the positions page, so
    // the provider must bisect and keep the priceable addresses.
    const BAD = "0x000000000000000000000000000000000000dead";
    const GOOD_A = "0x00000000000000000000000000000000000000a1";
    const GOOD_B = "0x00000000000000000000000000000000000000b2";
    const items = [GOOD_A, BAD, GOOD_B].map((address) => ({
      contract_decimals: 18,
      contract_name: "x",
      contract_ticker_symbol: "x",
      contract_address: address,
      is_native_token: false,
      is_spam: false,
      balance: "1000000000000000000",
      quote_rate: null,
      quote: null,
    }));
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (!p.includes("/pricing/")) return { items };
      const addrs = p.split("/USD/")[1]!.replace(/\/$/, "").split(",");
      if (addrs.includes(BAD)) {
        throw new PortfolioProviderError(
          `GoldRush request to ${p} failed with status 400: Contract address '${BAD}' not found!`,
          { providerStatus: 400 },
        );
      }
      return addrs.map((a) => ({
        contract_address: a,
        contract_decimals: 18,
        contract_name: "x",
        contract_ticker_symbol: "x",
        items: [{ price: 2 }],
      }));
    });

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    // The two priceable tokens survived; the unknown one is priced 0, not thrown.
    expect(out.find((t) => t.id === GOOD_A)!.price).toBe(2);
    expect(out.find((t) => t.id === GOOD_B)!.price).toBe(2);
    expect(out.find((t) => t.id === BAD)!.price).toBe(0);
  });

  it("does not swallow a genuine outage while isolating bad addresses", async () => {
    // The bisect must key on the "not found" 400 only. If it treated a 503 the same
    // way, a real outage would be bisected into dozens of doomed calls and then
    // reported as price 0 - an outage silently reading as a worthless portfolio.
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError("... failed with status 503", {
        providerStatus: 503,
      });
    });

    await expect(goldrushProvider.getTokenList("0xabc", ETH_CHAIN)).rejects.toBeInstanceOf(
      PortfolioProviderError,
    );
  });
});

describe("goldrushProvider chain-support handling", () => {
  it("skips a chain GoldRush does not support instead of raising an outage", async () => {
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError(
        "GoldRush request to /base-sepolia/... failed with status 501: Chain base-sepolia not supported.",
        { providerStatus: 501 },
      );
    });

    const out = await goldrushProvider.getAllTokenBalances("0xabc", [
      BASE_SEPOLIA_CHAIN,
    ]);
    // Skipped, NOT thrown: the chain is silently omitted.
    expect(out).toEqual([]);
  });

  it("still propagates a genuine 5xx as an outage", async () => {
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError("... failed with status 503", {
        providerStatus: 503,
      });
    });

    await expect(
      goldrushProvider.getAllTokenBalances("0xabc", [ETH_CHAIN]),
    ).rejects.toBeInstanceOf(PortfolioProviderError);
  });
});

describe("goldrushProvider chain-name mapping", () => {
  it("stamps the INTERNAL chain name, not the GoldRush slug", async () => {
    // aggregateBalances keys the provider's output by ChainMetadata.name. If the
    // adapter leaked the provider-side slug here, every configured asset would fail
    // to match and the entire portfolio would silently zero-fill. ETH_CHAIN cannot
    // expose this ("Ethereum" happens to be both), so the chain is deliberately one
    // whose internal name differs from its slug - mutation testing showed the bug
    // survived the whole suite while only Ethereum-shaped chains were tested.
    const BERA_CHAIN: ChainMetadata = {
      ...ETH_CHAIN,
      id: "berachain",
      name: "Berachain",
      debankName: "berachain",
      goldrushName: "berachain-mainnet",
      defillamaName: "berachain",
    };
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (p.includes("/pricing/")) return [];
      return {
        items: [
          {
            contract_decimals: 18,
            contract_name: "Bera",
            contract_ticker_symbol: "BERA",
            contract_address: "0x00000000000000000000000000000000000000a1",
            is_native_token: false,
            is_spam: false,
            balance: "1000000000000000000",
            quote_rate: null,
            quote: null,
          },
        ],
      };
    });

    const out = await goldrushProvider.getAllTokenBalances("0xabc", [BERA_CHAIN]);

    expect(out).toHaveLength(1);
    expect(out[0]!.chain).toBe("Berachain");
    expect(out[0]!.chain).not.toBe("berachain-mainnet");
  });
});

describe("goldrushProvider native-asset handling", () => {
  // The mock must branch on the path, because the provider makes TWO different
  // calls per chain - balances_v2 for balances and the pricing endpoint for
  // price. Returning one shape for both would pass while the real provider
  // silently priced everything at 0.
  function mockNative(price = 2000, balance = "1500000000000000000") {
    const pricingUrls: string[] = [];
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (p.includes("/pricing/")) {
        pricingUrls.push(p);
        return [
          {
            contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            contract_decimals: 18,
            contract_name: "Ether",
            contract_ticker_symbol: "ETH",
            items: [{ price }],
          },
        ];
      }
      return {
        items: [
          {
            contract_decimals: 18,
            contract_name: "Ether",
            contract_ticker_symbol: "ETH",
            contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            is_native_token: true,
            is_spam: false,
            balance,
            quote_rate: null,
            quote: null,
          },
        ],
      };
    });
    return { pricingUrls };
  }

  it("resolves native from the sentinel with a human-scale amount and its price", async () => {
    mockNative();
    const out = await goldrushProvider.getUserTokenBalanceInfo(
      "0xabc",
      ETH_CHAIN,
      NATIVE_TOKEN_IDENTIFIER,
    );
    expect(out.amount).toBe(1.5);
    expect(out.decimals).toBe(18);
    // Price came from the pricing endpoint, NOT from balances (which is null there).
    expect(out.price).toBe(2000);
    // wei leaking into `amount` would make this 3e21.
    expect(out.amount * out.price).toBeCloseTo(3000, 6);
  });

  it("translates the native sentinel to 0xeeee in the pricing request", async () => {
    // The sentinel must never leak to the HTTP call; GoldRush prices native via
    // the placeholder address.
    const { pricingUrls } = mockNative();
    await goldrushProvider.getUserTokenBalanceInfo(
      "0xabc",
      ETH_CHAIN,
      NATIVE_TOKEN_IDENTIFIER,
    );
    expect(pricingUrls.length).toBeGreaterThan(0);
    expect(pricingUrls[0]).toContain("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    expect(pricingUrls[0]).not.toContain(NATIVE_TOKEN_IDENTIFIER);
  });

  it("resolves native when the caller passes the chain's DeBank name", async () => {
    // tokenConsumptionEngine.ts:261 and consumeCrossChainTokens.ts:96 spell native
    // as the DeBank chain name, not the sentinel.
    mockNative();
    const out = await goldrushProvider.getUserTokenBalanceInfo("0xabc", ETH_CHAIN, "eth");
    expect(out.amount).toBe(1.5);
    expect(out.price).toBe(2000);
  });

  it("prices native through getTokenInfo without needing an address", async () => {
    // The pricing endpoint prices 0xeeee..., so the interface
    // does not have to widen. This is what tokenConsumptionEngine.ts:263 needs.
    mockNative();
    const info = await goldrushProvider.getTokenInfo(ETH_CHAIN, NATIVE_TOKEN_IDENTIFIER);
    expect(info.price).toBe(2000);
    expect(info.decimals).toBe(18);
  });

  it("returns a zeroed record for a token the user does not hold", async () => {
    mockNative();
    const out = await goldrushProvider.getUserTokenBalanceInfo("0xabc", ETH_CHAIN, "0xdead");
    expect(out.amount).toBe(0);
    expect(Number.isFinite(out.price)).toBe(true);
  });
});

describe("goldrushProvider DefiLlama fallback (LP tokens)", () => {
  /** A Uniswap V2 pair: GoldRush knows the address but prices it null/0. */
  const LP = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";
  const LP_ITEM = {
    contract_decimals: 18,
    contract_name: "Uniswap V2",
    contract_ticker_symbol: "UNI-V2",
    contract_address: LP,
    is_native_token: false,
    is_spam: false,
    balance: "1000000000000000000",
    quote_rate: null,
    quote: null,
  };

  function mockUnpricedLp() {
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (!p.includes("/pricing/")) return { items: [LP_ITEM] };
      return [
        {
          contract_address: LP,
          contract_decimals: 18,
          contract_name: "Uniswap V2",
          contract_ticker_symbol: "UNI-V2",
          items: [{ price: 0 }],
        },
      ];
    });
  }

  it("prices a pool share on the positions path that GoldRush left at zero", async () => {
    // The regression the fallback prevents: getUserPosition requires price > 0,
    // so an unpriced LP row would silently vanish instead of being displayed.
    mockUnpricedLp();
    llamaGetMock.mockResolvedValue({
      coins: { [`ethereum:${LP}`]: { price: 42.5, confidence: 0.9 } },
    });

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    expect(out).toHaveLength(1);
    expect(out[0]!.price).toBe(42.5);
    expect(out[0]!.amount).toBe(1);
  });

  it("falls back in getTokenInfo, which the engine uses to record a trade leg", async () => {
    // Without this, tokenConsumptionEngine records a $0 leg for every LP trade.
    goldrushGetMock.mockResolvedValue([
      {
        contract_address: LP,
        contract_decimals: 18,
        contract_name: "Uniswap V2",
        contract_ticker_symbol: "UNI-V2",
        items: [{ price: null }],
      },
    ]);
    llamaGetMock.mockResolvedValue({ coins: { [`ethereum:${LP}`]: { price: 42.5 } } });

    const info = await goldrushProvider.getTokenInfo(ETH_CHAIN, LP);

    expect(info.price).toBe(42.5);
  });

  it("keeps serving GoldRush data when DefiLlama is down", async () => {
    // A supplementary price source must never trip the fail-closed gate: the
    // token is still returned, only its price degrades to the pre-fallback 0.
    mockUnpricedLp();
    llamaGetMock.mockRejectedValue(new Error("DefiLlama failed with status 503"));

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    expect(out).toHaveLength(1);
    expect(out[0]!.price).toBe(0);
  });

  it("does not send the native sentinel to DefiLlama", async () => {
    goldrushGetMock.mockResolvedValue([
      {
        contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        contract_decimals: 18,
        contract_name: "Ether",
        contract_ticker_symbol: "ETH",
        items: [{ price: 2000 }],
      },
    ]);

    const info = await goldrushProvider.getTokenInfo(ETH_CHAIN, NATIVE_TOKEN_IDENTIFIER);

    expect(info.price).toBe(2000);
    expect(llamaGetMock).not.toHaveBeenCalled();
  });

  it("falls back when GoldRush rejects the address outright with a 400", async () => {
    // GoldRush 400s "Contract address ... not found!" for tokens its pricing DB
    // does not know. That is a per-token miss, not an outage, and an unknown token
    // is exactly what DefiLlama covers - so the request must not be aborted first.
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError(
        `GoldRush request failed with status 400: Contract address '${LP}' not found!`,
        { providerStatus: 400 },
      );
    });
    llamaGetMock.mockResolvedValue({ coins: { [`ethereum:${LP}`]: { price: 42.5 } } });

    const info = await goldrushProvider.getTokenInfo(ETH_CHAIN, LP);

    expect(info.price).toBe(42.5);
  });

  it("still propagates a genuine GoldRush outage from getTokenInfo", async () => {
    // Only the 400 "not found" miss is tolerated: a 503 must keep failing closed.
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError("... failed with status 503", {
        providerStatus: 503,
      });
    });

    await expect(goldrushProvider.getTokenInfo(ETH_CHAIN, LP)).rejects.toBeInstanceOf(
      PortfolioProviderError,
    );
  });
});

describe("goldrushProvider unsupported-chain handling, all methods", () => {
  function mockUnsupported() {
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError(
        "GoldRush request failed with status 501: Chain base-sepolia not supported.",
        { providerStatus: 501 },
      );
    });
  }

  it("getTokenList hides the chain instead of raising", async () => {
    mockUnsupported();
    await expect(
      goldrushProvider.getTokenList("0xabc", BASE_SEPOLIA_CHAIN),
    ).resolves.toEqual([]);
  });

  it("getTokenInfo returns a zeroed record instead of raising", async () => {
    mockUnsupported();
    const info = await goldrushProvider.getTokenInfo(BASE_SEPOLIA_CHAIN, "0xdead");
    expect(info.price).toBe(0);
    expect(info.decimals).toBe(0);
    expect(info.chain).toBe(BASE_SEPOLIA_CHAIN.name);
  });

  it("getUserTokenBalanceInfo returns a zeroed row instead of raising", async () => {
    mockUnsupported();
    const row = await goldrushProvider.getUserTokenBalanceInfo(
      "0xabc",
      BASE_SEPOLIA_CHAIN,
      "0xdead",
    );
    expect(row.amount).toBe(0);
    expect(row.price).toBe(0);
  });

  it("still treats a 552 provider-connection failure as an outage", async () => {
    // 552 arrives with "Connection to web3 provider failed" - NOT "not supported".
    // It is outage-shaped, so only the static flag may hide that chain; swallowing
    // it here would turn a real failure into a silently empty portfolio.
    goldrushGetMock.mockImplementation(async () => {
      throw new PortfolioProviderError(
        "GoldRush request failed with status 552: Connection to web3 provider failed",
        { providerStatus: 552 },
      );
    });

    await expect(
      goldrushProvider.getTokenList("0xabc", ETH_CHAIN),
    ).rejects.toBeInstanceOf(PortfolioProviderError);
  });
});

describe("goldrushProvider spam guard in getUserTokenBalanceInfo", () => {
  it("ignores a spam-flagged match rather than reporting its balance", async () => {
    const SPAM = "0x00000000000000000000000000000000000000a1";
    goldrushGetMock.mockResolvedValue({
      items: [
        {
          contract_decimals: 18,
          contract_name: "Spam",
          contract_ticker_symbol: "SPAM",
          contract_address: SPAM,
          is_native_token: false,
          is_spam: true,
          balance: "1000000000000000000",
          quote_rate: null,
          quote: null,
        },
      ],
    });

    const row = await goldrushProvider.getUserTokenBalanceInfo("0xabc", ETH_CHAIN, SPAM);

    expect(row.amount).toBe(0);
  });
});

describe("goldrushProvider inline quote_rate", () => {
  const TOKEN = "0x0000000000085d4780b73119b644ae5ecd22b376";

  function tusdItem(quote_rate: number | null) {
    return {
      contract_decimals: 18,
      contract_name: "TrueUSD",
      contract_ticker_symbol: "TUSD",
      contract_address: TOKEN,
      is_native_token: false,
      is_spam: false,
      balance: "21709487132565774000",
      quote_rate,
      quote: null,
    };
  }

  it("uses balances_v2's inline rate when the pricing endpoint has nothing", async () => {
    // Verified live: quote_rate is USD per token on the same scale as /pricing/.
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (!p.includes("/pricing/")) return { items: [tusdItem(1.001)] };
      return []; // the pricing endpoint simply has no entry for this token
    });

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    expect(out[0]!.price).toBe(1.001);
    // GoldRush's own number answered, so DefiLlama is not consulted at all.
    expect(llamaGetMock).not.toHaveBeenCalled();
  });

  it("does not let the inline rate override the pricing endpoint", async () => {
    // The pricing endpoint is the authoritative source; the inline rate is a fallback.
    goldrushGetMock.mockImplementation(async (p: string) => {
      if (!p.includes("/pricing/")) return { items: [tusdItem(999)] };
      return [
        {
          contract_address: TOKEN,
          contract_decimals: 18,
          contract_name: "TrueUSD",
          contract_ticker_symbol: "TUSD",
          items: [{ price: 1.001 }],
        },
      ];
    });

    const out = await goldrushProvider.getTokenList("0xabc", ETH_CHAIN);

    expect(out[0]!.price).toBe(1.001);
  });

  it("does not price tokens outside the requested set", async () => {
    // getAllTokenBalances only asks about configured assets, so an inline rate on
    // some other holding must not change the shape of the returned portfolio.
    const chain: ChainMetadata = { ...ETH_CHAIN, assets: [] };
    goldrushGetMock.mockImplementation(async () => ({ items: [tusdItem(1.001)] }));

    const out = await goldrushProvider.getAllTokenBalances("0xabc", [chain]);

    expect(out[0]!.price).toBe(0);
  });
});
