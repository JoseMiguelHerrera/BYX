import { beforeEach, describe, expect, it, vi } from "vitest";

const { llamaGetMock } = vi.hoisted(() => ({ llamaGetMock: vi.fn() }));

vi.mock("@/libs/portfolioAPI/providers/defillamaClient", () => ({
  llamaGet: llamaGetMock,
}));

import {
  mergeLlamaFallback,
  resolveLlamaSlug,
} from "@/libs/portfolioAPI/providers/defillamaPricing";
import type { ChainMetadata } from "@/libs/portfolioAPI/types";

/** A real Uniswap V2 pair address, as it appears in balances_v2 (lowercased). */
const UNI_V2 = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";
const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const chainWith = (over: Partial<ChainMetadata>): ChainMetadata => ({
  id: "ethereum",
  name: "Ethereum",
  debankName: "eth",
  assets: [],
  ...over,
});

const addressesOf = (n: number) =>
  Array.from({ length: n }, (_, i) => `0x${i.toString(16).padStart(40, "0")}`);

beforeEach(() => {
  llamaGetMock.mockReset();
});

describe("resolveLlamaSlug", () => {
  it("reads DefiLlama's slug from the DB column, which is not GoldRush's", () => {
    // GoldRush says `eth-mainnet`; DefiLlama says `ethereum`. Conflating them
    // would silently price against the wrong chain.
    expect(
      resolveLlamaSlug(chainWith({ goldrushName: "eth-mainnet", defillamaName: "ethereum" })),
    ).toBe("ethereum");
  });

  it("returns null when the chain has no DefiLlama slug", () => {
    expect(resolveLlamaSlug(chainWith({ defillamaName: null }))).toBeNull();
    expect(resolveLlamaSlug(chainWith({}))).toBeNull();
  });

  it("does not fall back to the chain id or the GoldRush slug", () => {
    // The slug is a verified per-chain fact. Deriving it from `id` would let an
    // unverified chain be priced against a guessed slug.
    expect(
      resolveLlamaSlug(chainWith({ id: "ethereum", goldrushName: "eth-mainnet" })),
    ).toBeNull();
  });
});

describe("mergeLlamaFallback", () => {
  it("fills a pool share GoldRush could not price", async () => {
    // GoldRush returns null for every LP: 0/4 Uniswap V2 pairs, 0/20 berachain
    // Islands. DefiLlama is the complement that prices them.
    llamaGetMock.mockResolvedValue({
      coins: { [`ethereum:${UNI_V2}`]: { price: 123.45, confidence: 0.9 } },
    });

    const merged = await mergeLlamaFallback("ethereum", [UNI_V2], new Map([[UNI_V2, 0]]));

    expect(merged.get(UNI_V2)).toBe(123.45);
  });

  it("does not overwrite a price GoldRush already resolved", async () => {
    const already = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    llamaGetMock.mockResolvedValue({ coins: { [`ethereum:${already}`]: { price: 1 } } });

    const merged = await mergeLlamaFallback("ethereum", [already], new Map([[already, 2]]));

    expect(merged.get(already)).toBe(2);
    // The request is only for what is missing, so GoldRush's answer stands.
    expect(llamaGetMock).not.toHaveBeenCalled();
  });

  it("never asks DefiLlama about the native sentinel", async () => {
    // GoldRush's 0xeeee path already prices natives; DefiLlama is weak on them.
    await mergeLlamaFallback("ethereum", [NATIVE], new Map([[NATIVE, 0]]));
    expect(llamaGetMock).not.toHaveBeenCalled();
  });

  it("makes no call when the chain has no DefiLlama slug", async () => {
    // resolveLlamaSlug returns null for a chain whose defillama_name is unset, and
    // a null slug must short-circuit rather than guess a chain.
    await mergeLlamaFallback(null, [UNI_V2], new Map());
    expect(llamaGetMock).not.toHaveBeenCalled();
  });

  it("keeps GoldRush's zeros when DefiLlama fails, instead of raising", async () => {
    // This is a supplementary price source: a DefiLlama outage must not trip the
    // fail-closed gate and hide a portfolio whose balances are perfectly fine.
    llamaGetMock.mockRejectedValue(new Error("429 after retries"));

    const merged = await mergeLlamaFallback("ethereum", [UNI_V2], new Map([[UNI_V2, 0]]));

    expect(merged.get(UNI_V2)).toBe(0);
  });

  it("ignores null, zero and non-finite prices", async () => {
    llamaGetMock.mockResolvedValue({
      coins: {
        [`ethereum:${UNI_V2}`]: { price: null },
        "ethereum:0x00000000000000000000000000000000000000b2": { price: 0 },
      },
    });

    const merged = await mergeLlamaFallback("ethereum", [UNI_V2], new Map([[UNI_V2, 0]]));

    expect(merged.get(UNI_V2)).toBe(0);
  });

  it("reads the address after the chain prefix and normalizes its case", async () => {
    llamaGetMock.mockResolvedValue({
      coins: { [`ethereum:${UNI_V2.toUpperCase()}`]: { price: 5 } },
    });

    const merged = await mergeLlamaFallback("ethereum", [UNI_V2], new Map([[UNI_V2, 0]]));

    expect(merged.get(UNI_V2)).toBe(5);
  });

  it("does not mutate the caller's map", async () => {
    llamaGetMock.mockResolvedValue({ coins: { [`ethereum:${UNI_V2}`]: { price: 9 } } });
    const prices = new Map([[UNI_V2, 0]]);

    await mergeLlamaFallback("ethereum", [UNI_V2], prices);

    expect(prices.get(UNI_V2)).toBe(0);
  });

  it("chunks a large unpriced set so the URL cannot exceed the limit", async () => {
    // getTokenList prices every token a wallet holds (3389 for the reference
    // wallet), so the unpriced subset must not be sent as one path segment.
    llamaGetMock.mockImplementation(async (path: string) => {
      const coins = path.split("/prices/current/")[1]!.split(",");
      return { coins: Object.fromEntries(coins.map((c) => [c, { price: 7 }])) };
    });
    const addresses = addressesOf(120);

    const merged = await mergeLlamaFallback("ethereum", addresses, new Map());

    expect(llamaGetMock).toHaveBeenCalledTimes(3); // 120 / 50
    expect(addresses.every((a) => merged.get(a) === 7)).toBe(true);
  });

  it("stops at the first failed chunk rather than hammering the endpoint", async () => {
    llamaGetMock.mockRejectedValue(new Error("429"));
    const addresses = addressesOf(120);

    await mergeLlamaFallback("ethereum", addresses, new Map());

    expect(llamaGetMock).toHaveBeenCalledTimes(1);
  });
});
