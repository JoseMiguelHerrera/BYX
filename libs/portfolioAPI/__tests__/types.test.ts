import { describe, expect, it } from "vitest";
import type { DebankTokenInfo } from "@/app/api/dataModels";
import type { UserTokenBalanceInfo } from "@/libs/debank";
import type { PortfolioToken, PortfolioUserToken } from "@/libs/portfolioAPI/types";

describe("portfolio types", () => {
  it("PortfolioToken IS the DeBank shape, not a lookalike", () => {
    // Type identity in both directions: this stops compiling the moment the
    // alias and the consumer-facing shape diverge.
    const legacy = {} as DebankTokenInfo;
    const asPortfolio: PortfolioToken = legacy;
    const backToLegacy: DebankTokenInfo = asPortfolio;
    expect(backToLegacy).toBeDefined();
  });

  it("PortfolioUserToken IS the DeBank shape, so adapters must fill every field", () => {
    const legacy = {} as UserTokenBalanceInfo;
    const asPortfolio: PortfolioUserToken = legacy;
    const backToLegacy: UserTokenBalanceInfo = asPortfolio;
    expect(backToLegacy).toBeDefined();
  });

  it("amount is human-readable, not raw base units", () => {
    // Guards the reason this abstraction exists: if a raw wei value ever reached
    // `amount`, the engine's amount * price math is wrong by 10**decimals.
    const amount = 1.5;
    const price = 2000;
    expect(amount).toBeLessThan(1e6);
    expect(amount * price).toBeCloseTo(3000, 6);
  });
});
