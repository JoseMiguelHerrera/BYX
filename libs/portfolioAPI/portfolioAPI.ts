import { aggregateBalances } from "@/libs/portfolioAPI/aggregate";
import { debankProvider } from "@/libs/portfolioAPI/providers/debankProvider";
import { goldrushProvider } from "@/libs/portfolioAPI/providers/goldrushProvider";
import type { PortfolioAPI, PortfolioToken } from "@/libs/portfolioAPI/types";

export type PortfolioProviderName = "debank" | "goldrush";

/**
 * Explicit configuration, not runtime failover: a typo must fail loudly rather
 * than silently select the wrong provider.
 */
export function getPortfolioAPI(): PortfolioAPI {
  // `||` (not `??`) so an explicitly empty variable is treated as unset, while
  // a typo still falls through to the loud unrecognized-value throw below.
  const raw = process.env.PORTFOLIO_API_PROVIDER || "debank";
  if (raw !== "debank" && raw !== "goldrush") {
    throw new Error(
      `PORTFOLIO_API_PROVIDER must be "debank" or "goldrush", received "${raw}"`,
    );
  }
  if (raw === "goldrush" && !process.env.GOLDRUSH_API_KEY) {
    throw new Error("GOLDRUSH_API_KEY is not set, but PORTFOLIO_API_PROVIDER=goldrush");
  }
  return raw === "goldrush" ? goldrushProvider : debankProvider;
}

export async function getBalances(address: string): Promise<PortfolioToken[]> {
  return aggregateBalances(getPortfolioAPI(), address);
}
