import { describe, expect, it } from "vitest";
import { PortfolioProviderError, isProviderOutage } from "@/libs/portfolioAPI/errors";

function providerError(status?: number): PortfolioProviderError {
  return new PortfolioProviderError("provider request failed", { providerStatus: status });
}

describe("isProviderOutage", () => {
  // These branches decide whether the fail-closed availability gate latches, which
  // in turn locks Positions/Invest/Divest. Mutation testing showed that flipping ANY
  // of the undefined/403/429 branches left the entire suite green - the only indirect
  // coverage was via aggregate's 5xx and 4xx cases - so each status is pinned here
  // rather than inferred from the aggregator.
  it.each<[string, number | undefined]>([
    ["a transport failure with no response", undefined],
    ["401 credential rejected", 401],
    ["403 credential rejected", 403],
    ["429 rate limited", 429],
    ["500", 500],
    ["502", 502],
    ["503", 503],
    ["504", 504],
    ["599 (GoldRush's holesky 552 sits in this family)", 552],
  ])("classifies %s as an outage", (_label, status) => {
    expect(isProviderOutage(providerError(status))).toBe(true);
  });

  it.each<[string, number]>([
    ["400 unknown contract (GoldRush's shape)", 400],
    ["404 unknown token (DeBank's shape)", 404],
    ["406 the zero-address family", 406],
    ["422", 422],
  ])("classifies %s as one bad request, not an outage", (_label, status) => {
    expect(isProviderOutage(providerError(status))).toBe(false);
  });

  it("ignores anything that is not a PortfolioProviderError", () => {
    // A plain Error or a duck-typed object must not be read as an outage: the gate is
    // fail-closed, so a false positive here takes the app down over a local bug.
    for (const value of [
      new Error("plain"),
      "503",
      null,
      undefined,
      { providerStatus: 503 },
      { name: "PortfolioProviderError", providerStatus: 503 },
    ]) {
      expect(isProviderOutage(value)).toBe(false);
    }
  });
});
