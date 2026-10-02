import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it, vi } from "vitest";
import type { ChainMetadata, PortfolioToken } from "@/libs/portfolioAPI/types";

const FIXTURES_DIR = path.resolve(
  fileURLToPath(new URL("../__fixtures__", import.meta.url)),
);
const DEBANK_DIR = path.join(FIXTURES_DIR, "debank");

// The configured assets for the fixture chain. Symbols must line up with the
// documented DeBank tokens (ETH native, CHI, TUSD).
const ETH_CHAIN: ChainMetadata = {
  id: "ethereum",
  name: "Ethereum",
  debankName: "eth",
  goldrushName: "eth-mainnet",
  supportedByGoldrush: true,
  defillamaName: "ethereum",
  assets: [
    {
      id: "asset-eth", name: "Ether", symbol: "ETH", type: "NATIVE",
      address: null, decimals: 18, isFundingAsset: false, priceUSD: 0,
    },
    {
      id: "asset-chi", name: "Chi Gastoken by 1inch", symbol: "CHI", type: "ERC20",
      address: "0x0000000000004946c0e9f43f4dee607b0ef1fa1c", decimals: 0,
      isFundingAsset: false, priceUSD: 0,
    },
    {
      id: "asset-tusd", name: "TrueUSD", symbol: "TUSD", type: "ERC20",
      address: "0x0000000000085d4780b73119b644ae5ecd22b376", decimals: 18,
      isFundingAsset: false, priceUSD: 0,
    },
  ],
};

// The SAME positions in GoldRush's shape: raw integer `balance` strings plus a
// separate `contract_decimals`, and `quote_rate`/`quote` null as the live API
// returns them. The raws are the documented `amount` values scaled by 10^decimals.
const GOLDRUSH_BALANCES = {
  items: [
    {
      contract_decimals: 18, contract_name: "Ether", contract_ticker_symbol: "ETH",
      contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      is_native_token: true, is_spam: false, balance: "17800000000000000",
      quote_rate: null, quote: null,
    },
    {
      contract_decimals: 0, contract_name: "Chi Gastoken by 1inch",
      contract_ticker_symbol: "CHI",
      contract_address: "0x0000000000004946c0e9f43f4dee607b0ef1fa1c",
      is_native_token: false, is_spam: false, balance: "3",
      quote_rate: null, quote: null,
    },
    {
      contract_decimals: 18, contract_name: "TrueUSD", contract_ticker_symbol: "TUSD",
      contract_address: "0x0000000000085d4780b73119b644ae5ecd22b376",
      is_native_token: false, is_spam: false, balance: "21709487132565774000",
      quote_rate: null, quote: null,
    },
  ],
};

const GOLDRUSH_PRICING = [
  {
    contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", contract_decimals: 18,
    contract_name: "Ether", contract_ticker_symbol: "ETH", items: [{ price: 2510.46 }],
  },
  {
    contract_address: "0x0000000000004946c0e9f43f4dee607b0ef1fa1c", contract_decimals: 0,
    contract_name: "Chi Gastoken by 1inch", contract_ticker_symbol: "CHI",
    items: [{ price: 0 }],
  },
  {
    contract_address: "0x0000000000085d4780b73119b644ae5ecd22b376", contract_decimals: 18,
    contract_name: "TrueUSD", contract_ticker_symbol: "TUSD", items: [{ price: 1 }],
  },
];

const keyOf = (r: PortfolioToken) => `${r.chain}:${r.symbol}`;
const sorted = (rs: PortfolioToken[]) =>
  [...rs].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));

describe("provider parity on the documented DeBank portfolio", () => {
  it("matches the documented amount <-> raw_amount identity (the proof itself)", () => {
    // DeBank documents `amount` as human-readable and `raw_amount` as base units.
    // If this identity ever fails, the
    // parity test below is comparing against a misunderstanding, so fail here.
    const tokens = JSON.parse(
      fs.readFileSync(path.join(DEBANK_DIR, "all-token-list.json"), "utf8"),
    );
    for (const t of tokens) {
      if (t.raw_amount === undefined) continue;
      const derived = t.amount * 10 ** t.decimals;
      expect(Math.abs(derived - t.raw_amount) / t.raw_amount).toBeLessThan(1e-12);
    }
  });

  it("produces identical rows from both providers", async () => {
    // DeBank side: serve the vendor's documented all_token_list payload, and
    // make the $0 fallback explode so a mismatch cannot be masked by it.
    vi.doMock("@/libs/debank", async () => {
      const actual = await vi.importActual<typeof import("@/libs/debank")>("@/libs/debank");
      return {
        ...actual,
        getAllUserTokenList: vi.fn(async () =>
          JSON.parse(fs.readFileSync(path.join(DEBANK_DIR, "all-token-list.json"), "utf8")),
        ),
        getTokenInfo: vi.fn(async () => {
          throw new Error("every fixture asset matched; the $0 fallback must not run");
        }),
      };
    });

    // GoldRush side: balances and pricing are different paths; a mock that
    // returned one shape for both would pass while pricing everything at 0.
    vi.doMock("@/libs/portfolioAPI/providers/goldrushClient", () => ({
      goldrushGet: vi.fn(async (p: string) =>
        p.includes("/pricing/") ? GOLDRUSH_PRICING : GOLDRUSH_BALANCES,
      ),
    }));

    // Parity is asserted against DeBank's documented prices, so the DefiLlama
    // top-up must stay out of the way: answering nothing keeps GoldRush's values
    // authoritative and stops this test from depending on the live API.
    vi.doMock("@/libs/portfolioAPI/providers/defillamaClient", () => ({
      llamaGet: vi.fn(async () => ({ coins: {} })),
    }));

    vi.resetModules();
    const { debankProvider } = await import("@/libs/portfolioAPI/providers/debankProvider");
    const { goldrushProvider } = await import(
      "@/libs/portfolioAPI/providers/goldrushProvider"
    );

    const fromDebank = await debankProvider.getAllTokenBalances("0xabc", [ETH_CHAIN]);
    const fromGoldrush = await goldrushProvider.getAllTokenBalances("0xabc", [ETH_CHAIN]);

    // Same rows, same symbols, same chains.
    expect(sorted(fromGoldrush).map(keyOf)).toEqual(sorted(fromDebank).map(keyOf));

    for (const d of sorted(fromDebank)) {
      const g = fromGoldrush.find((r) => keyOf(r) === keyOf(d))!;
      expect(g).toBeDefined();
      // Exact for these documented values: `amount` and `raw / 10**decimals`
      // are bit-identical (verified for all four fixture entries).
      expect(g.balance).toBe(d.balance);
      expect(g.price).toBe(d.price);
      expect(g.usdValue).toBeCloseTo(d.usdValue, 9);
      // isNativeAsset is NOT compared here: at the provider level the two
      // adapters derive it from different sources (asset.type vs
      // is_native_token). aggregateBalances normalizes it from the config, and
      // aggregate.test.ts asserts that, so this layer would test the wrong thing.
    }

    // Sanity: the fixture actually exercised a non-zero, non-18-decimal case
    // and a zero-decimal case, so the equality above is not vacuous.
    expect(fromDebank.map((r) => r.symbol).sort()).toEqual(["CHI", "ETH", "TUSD"]);
    const tusd = fromDebank.find((r) => r.symbol === "TUSD")!;
    expect(tusd.balance).toBe("21.709487132565773");
    expect(tusd.usdValue).toBeCloseTo(21.709487132565773, 9);
    const chi = fromDebank.find((r) => r.symbol === "CHI")!;
    expect(chi.balance).toBe("3"); // 0-decimal token passes through unchanged
  });
});
