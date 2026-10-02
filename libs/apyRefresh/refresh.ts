import type { LlamaPool } from "@/libs/portfolioAPI/providers/defillamaYields";
import {
  selectApyUpdates,
  type ApyUpdate,
  type PinnedOpportunity,
} from "@/libs/apyRefresh/selectApyUpdates";

export interface RefreshDeps {
  loadPinned: () => Promise<PinnedOpportunity[]>;
  fetchPools: () => Promise<LlamaPool[]>;
  persist: (updates: ApyUpdate[]) => Promise<void>;
}

/**
 * One refresh pass: read the pinned rows, fetch the snapshot, select, persist.
 *
 * Dependencies are injected so the pass is testable without network or DB. A
 * fetch failure propagates before `persist` is called, so a DefiLlama outage
 * leaves every stored APY exactly as it was.
 *
 * Returns the number of rows written.
 */
export async function refreshApysOnce(deps: RefreshDeps): Promise<number> {
  const pinned = await deps.loadPinned();
  if (pinned.length === 0) return 0;

  const pools = await deps.fetchPools();
  const updates = selectApyUpdates(pools, pinned);
  await deps.persist(updates);
  return updates.length;
}
