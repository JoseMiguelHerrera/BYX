import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";

const LLAMA_COINS_BASE_URL = "https://coins.llama.fi";
const LLAMA_REQUEST_TIMEOUT_MS = 15_000;
const LLAMA_MAX_RETRIES = 2;

/**
 * Cap on a server-supplied `Retry-After`. Without it a hostile or merely
 * overloaded response (`Retry-After: 3600`) would sleep for an hour inside the
 * balances/positions request path - the very "UI stuck loading" failure the
 * goldrushClient timeout exists to prevent. A supplementary price source must
 * never be able to hang the request, so the wait is bounded and the call then
 * either retries or degrades.
 */
const LLAMA_MAX_RETRY_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * DefiLlama's APIs are keyless and rate limited (~300 rpm on the free tier),
 * so unlike `goldrushGet` a 429 is an expected steady-state condition rather than
 * a credential or outage signal. It is retried honouring `Retry-After`; only a
 * persistent 429 becomes a PortfolioProviderError.
 *
 * Everything else maps to PortfolioProviderError the same way `goldrushGet` does,
 * so callers can keep one error vocabulary.
 *
 * Parameterized by host because DefiLlama serves prices from `coins.llama.fi`
 * and yields from `yields.llama.fi`. Duplicating this logic per host would let
 * their retry and error semantics drift apart.
 */
export function createLlamaGet(baseUrl: string) {
  return async function llamaGet<T>(path: string, attempt = 0): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLAMA_REQUEST_TIMEOUT_MS);
    let providerStatus: number | undefined;
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      providerStatus = response.status;
      if (response.status === 429 && attempt < LLAMA_MAX_RETRIES) {
        const header = response.headers.get("retry-after");
        const parsed = header === null ? NaN : Number(header);
        const requestedMs =
          Number.isFinite(parsed) && parsed >= 0 ? parsed * 1000 : 1000 * (attempt + 1);
        const delayMs = Math.min(requestedMs, LLAMA_MAX_RETRY_DELAY_MS);
        clearTimeout(timer);
        await sleep(delayMs);
        return llamaGet<T>(path, attempt + 1);
      }
      if (!response.ok) {
        throw new PortfolioProviderError(
          `DefiLlama request to ${path} failed with status ${response.status}`,
          { providerStatus: response.status },
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof PortfolioProviderError) throw error;
      throw new PortfolioProviderError(
        `DefiLlama request to ${path} failed${
          providerStatus ? ` with status ${providerStatus}` : ""
        }`,
        { providerStatus, cause: error },
      );
    } finally {
      clearTimeout(timer);
    }
  };
}

/** Price API (`/prices/current/...`). */
export const llamaGet = createLlamaGet(LLAMA_COINS_BASE_URL);
