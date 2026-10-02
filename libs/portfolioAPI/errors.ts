import { PORTFOLIO_UNAVAILABLE_CODE } from "@/libs/portfolioErrors";

/**
 * Raised when the portfolio data provider cannot serve a request.
 *
 * Callers must treat this as a retryable "provider unavailable" condition and
 * NOT as an empty portfolio, otherwise an outage silently reads as "the user
 * holds nothing" and corrupts downstream decisions.
 */
export class PortfolioProviderError extends Error {
  readonly code = PORTFOLIO_UNAVAILABLE_CODE;
  readonly providerStatus?: number;

  constructor(
    message: string,
    options?: { providerStatus?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "PortfolioProviderError";
    this.providerStatus = options?.providerStatus;
  }
}

/**
 * Distinguishes "the provider is down" from "the provider answered and rejected
 * this one request".
 *
 * Moved here from libs/debank.ts so the shared aggregator applies the SAME rule.
 * If it stayed private to debank.ts, aggregate.ts would have to fall back on
 * `instanceof PortfolioProviderError` - which ALSO matches per-request 4xx
 * failures. Propagating those fails the whole balances page and, because the gate
 * is fail-closed, locks Positions/Invest/Divest over a single unrecognised token.
 * That is the I2 defect, already fixed once in libs/debank.ts:68-77.
 *
 * GoldRush makes this sharper: an unknown token is a 400 (not a 404), in a
 * different status family, so the rule must be shared rather than re-guessed.
 */
export function isProviderOutage(error: unknown): boolean {
  if (!(error instanceof PortfolioProviderError)) return false;
  const status = error.providerStatus;
  if (status === undefined) return true; // network failure or timeout
  if (status === 401 || status === 403) return true; // credential rejected
  if (status === 429) return true; // rate limited
  if (status >= 500) return true; // provider-side failure
  return false; // other 4xx: one bad request, not an outage
}
