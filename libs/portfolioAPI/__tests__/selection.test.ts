import { afterEach, describe, expect, it, vi } from "vitest";
import { getPortfolioAPI } from "@/libs/portfolioAPI/portfolioAPI";

// Modules in this import chain call dotenv.config() when loaded, which would
// read a developer's local .env and repopulate the variables these tests clear.
vi.mock("dotenv", () => {
  const config = () => ({ parsed: {} });
  return { default: { config }, config };
});

describe("provider selection", () => {
  const original = { ...process.env };
  afterEach(() => {
    // Unstub BEFORE replacing process.env so vi's own bookkeeping is not left
    // pointing at a discarded object, then restore the pre-test snapshot.
    vi.unstubAllEnvs();
    process.env = { ...original };
    vi.resetModules();
  });

  it("defaults to debank when unset", async () => {
    // vi.stubEnv(name, undefined) is not a reliable way to unset a variable,
    // so delete it directly; afterEach restores the original environment.
    delete process.env.PORTFOLIO_API_PROVIDER;
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(get().name).toBe("debank");
  });

  it("treats an explicitly empty value as unset", async () => {
    // `??` would not catch "", so an empty export used to throw on every request.
    vi.stubEnv("PORTFOLIO_API_PROVIDER", "");
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(get().name).toBe("debank");
  });

  it("selects goldrush when configured", async () => {
    vi.stubEnv("PORTFOLIO_API_PROVIDER", "goldrush");
    vi.stubEnv("GOLDRUSH_API_KEY", "test-key");
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(get().name).toBe("goldrush");
  });

  it("throws on an unrecognized value instead of silently defaulting", async () => {
    vi.stubEnv("PORTFOLIO_API_PROVIDER", "goldrsuh");
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(() => get()).toThrow(/PORTFOLIO_API_PROVIDER/);
  });

  it("requires GOLDRUSH_API_KEY only in goldrush mode", async () => {
    vi.stubEnv("PORTFOLIO_API_PROVIDER", "goldrush");
    // MUST be present-but-empty, not deleted. libs/debank.ts runs dotenv.config()
    // on every module evaluation, and dotenv repopulates keys that are missing
    // from process.env - so `delete` would be silently undone by .env and the
    // guard would never fire. An empty string is defined, so dotenv skips it.
    vi.stubEnv("GOLDRUSH_API_KEY", "");
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(() => get()).toThrow(/GOLDRUSH_API_KEY/);
  });

  it("does not require GOLDRUSH_API_KEY in debank mode", async () => {
    // The other half of "only": a GoldRush key must not be a precondition for
    // selecting DeBank, or a key-less deployment could not run at all.
    vi.stubEnv("PORTFOLIO_API_PROVIDER", "debank");
    vi.stubEnv("GOLDRUSH_API_KEY", "");
    vi.resetModules();
    const { getPortfolioAPI: get } = await import("@/libs/portfolioAPI/portfolioAPI");
    expect(get().name).toBe("debank");
  });
});
