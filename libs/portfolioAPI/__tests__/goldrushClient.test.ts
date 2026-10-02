import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { goldrushGet } from "@/libs/portfolioAPI/providers/goldrushClient";

const TEST_KEY = "test-key";

// A real 200 Response exposes `ok: true` and a `json()` reader. The brief's
// helper only set `status`/`data`, so the client saw `ok === undefined` (falsy)
// and took the error path, then tripped over `json === undefined`. Each test
// supplies its own body here.
const ok = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);

describe("goldrushGet", () => {
  // The client refuses to call fetch without a key, so without this the
  // "success" case (and even the error stubs) would short-circuit inside
  // apiKey() and never exercise the transport they claim to test.
  beforeEach(() => vi.stubEnv("GOLDRUSH_API_KEY", TEST_KEY));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the parsed body on 200", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ data: { items: [] } })));
    // The client unwraps the envelope, so the result is `body.data`.
    await expect(goldrushGet("/x")).resolves.toEqual({ items: [] });
  });

  it("sends the key in the Authorization header, never the URL", async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedInit = init;
        return ok({ data: {} });
      }),
    );
    await goldrushGet("/x");
    expect(capturedUrl).not.toContain(TEST_KEY);
    expect((capturedInit?.headers as Record<string, string> | undefined)?.Authorization).toBe(
      `Bearer ${TEST_KEY}`,
    );
  });

  it("raises PortfolioProviderError on 403, so the availability gate engages", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ status: 403 } as Response)));
    await expect(goldrushGet("/x")).rejects.toBeInstanceOf(PortfolioProviderError);
  });

  it("raises PortfolioProviderError on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ status: 429 } as Response)));
    await expect(goldrushGet("/x")).rejects.toBeInstanceOf(PortfolioProviderError);
  });

  it("carries the provider status so callers can distinguish an outage", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ status: 503 } as Response)));
    await expect(goldrushGet("/x")).rejects.toMatchObject({ providerStatus: 503 });
  });

  it("preserves the API's error_message so 'not supported' can be told from an outage", async () => {
    // The 501-vs-outage discrimination depends on this text surviving.
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        status: 501,
        json: async () => ({
          error: true,
          error_message: "Chain base-sepolia not supported.",
          error_code: 501,
        }),
      } as unknown as Response),
    ));
    await expect(goldrushGet("/x")).rejects.toThrow(/not supported/i);
  });

  it("raises PortfolioProviderError on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))));
    await expect(goldrushGet("/x")).rejects.toBeInstanceOf(PortfolioProviderError);
  });
});

describe("goldrushGet transient-status retries", () => {
  // GoldRush's docs classify 429/500/503 as transient and prescribe backoff-and-
  // retry; a live 503 "backend queue is full" cleared within a minute while the
  // app surfaced it as a hard outage. Without retrying, one queue-full blip
  // closes the fail-closed portfolio gate for the whole app.
  // A response-like object carrying a JSON error body; retryable stubs need
  // `headers` because the client reads Retry-After off them.
  const transient = (status: number, error_message: string) =>
    Promise.resolve({
      ok: false,
      status,
      headers: { get: () => null },
      json: async () => ({ error: true, error_message }),
    } as unknown as Response);

  beforeEach(() => vi.stubEnv("GOLDRUSH_API_KEY", TEST_KEY));
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("retries a 503 backend-queue error and succeeds on a later attempt", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => transient(503, "backend queue is full and cannot accept request"))
      .mockImplementationOnce(() => ok({ data: { items: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = goldrushGet<{ items: [] }>("/x");
    // Worst-case wait: 2^attempt * 1s + up to 1s jitter, capped at 5s per retry.
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries 429 and 500 as well", async () => {
    vi.useFakeTimers();
    for (const status of [429, 500]) {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(() => transient(status, "transient"))
        .mockImplementationOnce(() => ok({ data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      const pending = goldrushGet("/x");
      await vi.advanceTimersByTimeAsync(5_000);
      await expect(pending).resolves.toEqual({});
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
  });

  it("gives up after bounded retries and still reports providerStatus", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() => transient(503, "backend queue is full and cannot accept request"));
    vi.stubGlobal("fetch", fetchMock);

    const pending = goldrushGet("/x");
    // Attach the rejection handler before flushing timers, otherwise the
    // mid-advance rejection registers as an unhandled rejection.
    const assertion = expect(pending).rejects.toMatchObject({ providerStatus: 503 });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("does not retry a 400 so the per-address bisect path keeps working", async () => {
    vi.useFakeTimers();
    // The pricing bisect isolates "Contract address not found" 400s; retrying
    // 4xx would multiply doomed calls and delay genuine per-token misses.
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => transient(400, "Contract address '0xabc' not found!"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(goldrushGet("/x")).rejects.toMatchObject({ providerStatus: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry 401/403 - a rejected key will not fix itself", async () => {
    vi.useFakeTimers();
    for (const status of [401, 403]) {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(() => transient(status, "No valid API key was provided."));
      vi.stubGlobal("fetch", fetchMock);

      await expect(goldrushGet("/x")).rejects.toBeInstanceOf(PortfolioProviderError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("honours Retry-After but caps the wait", async () => {
    vi.useFakeTimers();
    const retryAfter = (seconds: string) =>
      Promise.resolve({
        ok: false,
        status: 503,
        headers: { get: (h: string) => (h.toLowerCase() === "retry-after" ? seconds : null) },
        json: async () => ({ error: true, error_message: "degraded" }),
      } as unknown as Response);
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => retryAfter("3600"))
      .mockImplementationOnce(() => ok({ data: { ok: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = goldrushGet("/x");
    // An hour-long Retry-After must not hang a user-facing request: advancing
    // past the 5s cap is enough, and the retry must have fired by then.
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
