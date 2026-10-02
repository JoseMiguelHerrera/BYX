import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";

const GOLDRUSH_API_BASE_URL = "https://api.covalenthq.com/v1";
// eth-mainnet balances_v2 has been observed at ~17s under load; 15s aborted a
// healthy response and tripped the fail-closed portfolio gate for the whole app.
const GOLDRUSH_REQUEST_TIMEOUT_MS = 30_000;

/**
 * GoldRush's error-handling docs classify 429/500/503 as transient and prescribe
 * backoff-and-retry. A live 503 "backend queue is full and cannot accept request"
 * on the pricing endpoint cleared within a minute on its own while the app
 * surfaced it as a hard outage and closed the portfolio gate - so a bounded retry
 * here is the difference between a blip and a demo-stopping failure.
 */
const GOLDRUSH_TRANSIENT_STATUSES = new Set([429, 500, 503]);
const GOLDRUSH_MAX_RETRIES = 2;
/**
 * Cap on a server-supplied `Retry-After`, mirroring llamaGet: a degraded
 * response asking for an hour must not hang a user-facing request path.
 */
const GOLDRUSH_MAX_RETRY_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const parsed = retryAfterHeader === null ? NaN : Number(retryAfterHeader);
  const requestedMs =
    Number.isFinite(parsed) && parsed >= 0
      ? parsed * 1000
      : // Exponential backoff with jitter, per the GoldRush docs' own recipe.
        2 ** attempt * 1_000 + Math.random() * 1_000;
  return Math.min(requestedMs, GOLDRUSH_MAX_RETRY_DELAY_MS);
}

function apiKey(): string {
  const key = process.env.GOLDRUSH_API_KEY;
  if (!key) throw new Error("GOLDRUSH_API_KEY is not set");
  return key;
}

/**
 * Single transport entry point, mirroring `debankGet`.
 *
 * Every non-2xx and every network failure becomes PortfolioProviderError so the
 * existing 503 -> PORTFOLIO_UNAVAILABLE -> closed-gate path works unchanged.
 * Transient statuses (429/500/503) are retried with bounded backoff first, per
 * GoldRush's own guidance, so a momentary queue-full blip doesn't gate the app.
 */
export async function goldrushGet<T>(
  path: string,
  attempt = 0,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOLDRUSH_REQUEST_TIMEOUT_MS);
  let providerStatus: number | undefined;
  try {
    const response = await fetch(`${GOLDRUSH_API_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    providerStatus = response.status;
    if (
      GOLDRUSH_TRANSIENT_STATUSES.has(response.status) &&
      attempt < GOLDRUSH_MAX_RETRIES
    ) {
      clearTimeout(timer);
      await sleep(retryDelayMs(attempt, response.headers.get("retry-after")));
      return goldrushGet<T>(path, attempt + 1);
    }
    if (!response.ok) {
      // Read the body: GoldRush puts the discriminator in error_message, and
      // callers need it to tell "chain not supported" (a 501 support fact) from
      // a real outage. Dropping it would make every 501 look like an outage.
      const detail = await response
        .json()
        .then((b: { error_message?: string }) => b?.error_message ?? "")
        .catch(() => "");
      throw new PortfolioProviderError(
        `GoldRush request to ${path} failed with status ${response.status}${
          detail ? `: ${detail}` : ""
        }`,
        { providerStatus: response.status },
      );
    }
    const body = (await response.json()) as { data?: T; error?: boolean };
    if (body.error) {
      throw new PortfolioProviderError(`GoldRush returned an error for ${path}`, {
        providerStatus: response.status,
      });
    }
    return (body.data ?? ({} as T)) as T;
  } catch (error) {
    if (error instanceof PortfolioProviderError) throw error;
    throw new PortfolioProviderError(
      `GoldRush request to ${path} failed${
        providerStatus ? ` with status ${providerStatus}` : ""
      }`,
      { providerStatus, cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}
