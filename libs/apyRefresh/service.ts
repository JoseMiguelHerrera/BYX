import { getPinnedOpportunities, updateOpportunityApys } from "@/database/queries";
import {
  llamaYieldsGet,
  type LlamaPoolsResponse,
} from "@/libs/portfolioAPI/providers/defillamaYields";
import { refreshApysOnce } from "@/libs/apyRefresh/refresh";

const DEFAULT_INTERVAL_MS = 3_600_000;

/**
 * Refresh opportunity APYs on an interval, starting with one immediate pass so a
 * cold start does not wait a full cycle.
 *
 * Ticks that fire while a previous pass is still in flight are skipped rather
 * than stacked - the endpoint is a single large snapshot and there is nothing to
 * gain from concurrent fetches. The interval is unref'd so it never holds the
 * process open.
 */
export function startApyRefresh(): void {
  if (process.env.APY_REFRESH_ENABLED === "false") {
    console.log("[apyRefresh] disabled via APY_REFRESH_ENABLED");
    return;
  }

  const parsed = Number(process.env.APY_REFRESH_INTERVAL_MS);
  const intervalMs =
    Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;

  let inFlight = false;

  const tick = async (): Promise<void> => {
    if (inFlight) return;
    inFlight = true;
    try {
      const updated = await refreshApysOnce({
        loadPinned: getPinnedOpportunities,
        fetchPools: async () => {
          const response = await llamaYieldsGet<LlamaPoolsResponse>("/pools");
          return response?.data ?? [];
        },
        persist: updateOpportunityApys,
      });
      console.log(`[apyRefresh] updated ${updated} opportunities`);
    } catch (error) {
      console.warn(
        "[apyRefresh] refresh failed; stored APYs left unchanged:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      inFlight = false;
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
  console.log(`[apyRefresh] scheduled every ${intervalMs}ms`);
}
