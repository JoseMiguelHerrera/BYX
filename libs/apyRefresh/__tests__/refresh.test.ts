import { describe, expect, it, vi } from "vitest";
import type { LlamaPool } from "@/libs/portfolioAPI/providers/defillamaYields";
import { refreshApysOnce } from "@/libs/apyRefresh/refresh";

function pool(poolId: string, apy: number | null): LlamaPool {
  return {
    pool: poolId,
    chain: "Ethereum",
    project: "test",
    symbol: "TEST",
    apy,
    apyBase: apy,
    apyReward: null,
    underlyingTokens: null,
  };
}

describe("refreshApysOnce", () => {
  it("persists only the updates the snapshot justifies", async () => {
    const persist = vi.fn(async () => {});
    const updated = await refreshApysOnce({
      loadPinned: async () => [
        { id: "1", poolId: "a" },
        { id: "2", poolId: "missing" },
        { id: "3", poolId: "zero" },
      ],
      fetchPools: async () => [pool("a", 4.2), pool("zero", 0)],
      persist,
    });

    expect(updated).toBe(1);
    expect(persist).toHaveBeenCalledWith([{ id: "1", apy: 4.2 }]);
  });

  it("does not fetch or persist when nothing is pinned", async () => {
    const fetchPools = vi.fn(async () => []);
    const persist = vi.fn(async () => {});

    const updated = await refreshApysOnce({
      loadPinned: async () => [],
      fetchPools,
      persist,
    });

    expect(updated).toBe(0);
    expect(fetchPools).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it("propagates a fetch failure without touching the table", async () => {
    const persist = vi.fn(async () => {});

    await expect(
      refreshApysOnce({
        loadPinned: async () => [{ id: "1", poolId: "a" }],
        fetchPools: async () => {
          throw new Error("boom");
        },
        persist,
      }),
    ).rejects.toThrow("boom");

    expect(persist).not.toHaveBeenCalled();
  });
});
