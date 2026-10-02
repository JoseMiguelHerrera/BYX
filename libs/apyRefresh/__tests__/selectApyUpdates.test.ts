import { describe, expect, it } from "vitest";
import type { LlamaPool } from "@/libs/portfolioAPI/providers/defillamaYields";
import { selectApyUpdates } from "@/libs/apyRefresh/selectApyUpdates";

function pool(overrides: Partial<LlamaPool> & { pool: string }): LlamaPool {
  return {
    chain: "Ethereum",
    project: "test",
    symbol: "TEST",
    apy: 5,
    apyBase: 5,
    apyReward: null,
    underlyingTokens: null,
    ...overrides,
  };
}

describe("selectApyUpdates", () => {
  it("returns the apy for a pinned pool that is present", () => {
    const pools = [pool({ pool: "a", apy: 18.23 })];
    expect(selectApyUpdates(pools, [{ id: "6", poolId: "a" }])).toEqual([
      { id: "6", apy: 18.23 },
    ]);
  });

  it("skips a pinned pool that is absent from the snapshot", () => {
    expect(selectApyUpdates([], [{ id: "12", poolId: "missing" }])).toEqual([]);
  });

  it("skips a pool reporting zero, null, or non-finite", () => {
    const pools = [
      pool({ pool: "zero", apy: 0 }),
      pool({ pool: "null", apy: null }),
      pool({ pool: "nan", apy: Number.NaN }),
      pool({ pool: "inf", apy: Number.POSITIVE_INFINITY }),
    ];
    const pinned = [
      { id: "1", poolId: "zero" },
      { id: "2", poolId: "null" },
      { id: "3", poolId: "nan" },
      { id: "4", poolId: "inf" },
    ];
    expect(selectApyUpdates(pools, pinned)).toEqual([]);
  });

  it("returns nothing when nothing is pinned", () => {
    expect(selectApyUpdates([pool({ pool: "a" })], [])).toEqual([]);
  });

  it("is order-independent and keeps only the pinned rows", () => {
    const pools = [
      pool({ pool: "a", apy: 1 }),
      pool({ pool: "b", apy: 2 }),
      pool({ pool: "c", apy: 3 }),
    ];
    const pinned = [
      { id: "x", poolId: "c" },
      { id: "y", poolId: "a" },
    ];
    expect(selectApyUpdates(pools, pinned)).toEqual([
      { id: "x", apy: 3 },
      { id: "y", apy: 1 },
    ]);
  });
});
