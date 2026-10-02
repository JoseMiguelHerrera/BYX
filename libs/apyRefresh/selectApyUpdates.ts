import type { LlamaPool } from "@/libs/portfolioAPI/providers/defillamaYields";

export interface PinnedOpportunity {
  id: string;
  poolId: string;
}

export interface ApyUpdate {
  id: string;
  apy: number;
}

/**
 * Pick the APY updates a snapshot justifies, for the rows that are actually
 * pinned to a pool.
 *
 * A row is skipped - keeping its stored APY - when its pool is absent from the
 * snapshot, or when the pool reports `0`/`null`/non-finite. Llama reports 0
 * transiently for thin or paused vaults, and overwriting a real APY with 0 is
 * worse for a yield product than showing a stale-but-plausible one.
 */
export function selectApyUpdates(
  pools: LlamaPool[],
  pinned: PinnedOpportunity[],
): ApyUpdate[] {
  const byPoolId = new Map(pools.map((p) => [p.pool, p]));
  const updates: ApyUpdate[] = [];
  for (const { id, poolId } of pinned) {
    const apy = byPoolId.get(poolId)?.apy;
    if (typeof apy !== "number" || !Number.isFinite(apy) || apy <= 0) continue;
    updates.push({ id, apy });
  }
  return updates;
}
