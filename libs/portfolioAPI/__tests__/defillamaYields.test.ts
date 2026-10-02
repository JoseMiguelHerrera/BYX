import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioProviderError } from "@/libs/portfolioAPI/errors";
import { llamaYieldsGet } from "@/libs/portfolioAPI/providers/defillamaYields";

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response => new Response(JSON.stringify(body), { status, headers });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("llamaYieldsGet", () => {
  it("hits the yields host, not the coins host", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaYieldsGet("/pools")).resolves.toEqual({ status: "success", data: [] });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://yields.llama.fi/pools");
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("retries a 429 after Retry-After and succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429, { "retry-after": "0" }))
      .mockResolvedValueOnce(jsonResponse({ status: "success", data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaYieldsGet("/pools")).resolves.toEqual({ status: "success", data: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps a non-429 failure to a provider error carrying the status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));

    await expect(llamaYieldsGet("/pools")).rejects.toMatchObject({ providerStatus: 500 });
  });

  it("gives up after bounded retries on a persistent 429", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "rate limited" }, 429, { "retry-after": "0" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(llamaYieldsGet("/pools")).rejects.toBeInstanceOf(PortfolioProviderError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
