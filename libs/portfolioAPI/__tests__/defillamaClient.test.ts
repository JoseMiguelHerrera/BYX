import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { llamaGet } from "@/libs/portfolioAPI/providers/defillamaClient";

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response => new Response(JSON.stringify(body), { status, headers });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("llamaGet", () => {
  it("needs no credential and returns the parsed body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ coins: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaGet("/prices/current/ethereum:0xabc")).resolves.toEqual({
      coins: {},
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://coins.llama.fi/prices/current/ethereum:0xabc");
    // Keyless on purpose: no Authorization header to leak or rotate.
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("retries a 429 after Retry-After and succeeds", async () => {
    // A 429 is expected steady state on the keyless fair-use tier (~300 rpm), so
    // it must not be handed to the outage classifier as-is.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429, { "retry-after": "0" }))
      .mockResolvedValueOnce(
        jsonResponse({ coins: { "ethereum:0xabc": { price: 1 } } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaGet("/prices/current/ethereum:0xabc")).resolves.toEqual({
      coins: { "ethereum:0xabc": { price: 1 } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after bounded retries and reports a provider error", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "rate limited" }, 429, { "retry-after": "0" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaGet("/prices/current/x")).rejects.toBeInstanceOf(
      PortfolioProviderError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it("maps a non-429 failure to a provider error carrying the status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));

    await expect(llamaGet("/prices/current/x")).rejects.toMatchObject({
      providerStatus: 500,
    });
  });

  it("maps a network failure to a provider error with no status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await llamaGet("/prices/current/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PortfolioProviderError);
    expect((error as PortfolioProviderError).providerStatus).toBeUndefined();
  });

  it("clamps a hostile Retry-After instead of hanging the request", async () => {
    // Without a cap, `Retry-After: 3600` would sleep for an hour inside the
    // balances/positions path - a supplementary price source must never be able
    // to stall a user-facing request.
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({}, 429, { "retry-after": "3600" }))
        .mockResolvedValueOnce(jsonResponse({ coins: { "ethereum:0xabc": { price: 1 } } }));
      vi.stubGlobal("fetch", fetchMock);

      const pending = llamaGet("/prices/current/ethereum:0xabc");
      // Advancing past the clamp is enough; the requested hour must not be waited.
      await vi.advanceTimersByTimeAsync(5_000);

      await expect(pending).resolves.toEqual({
        coins: { "ethereum:0xabc": { price: 1 } },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
