import { describe, expect, it } from "vitest";
import { toHumanAmount } from "@/libs/portfolioAPI/providers/goldrushProvider";

/**
 * Consumer-invariant tests.
 *
 * DeBank is no longer callable, so there is no ground truth to diff against.
 * These tests instead pin the contracts the app's consumers were written
 * against - each assertion cites the consumer expression that requires it.
 * A failure here is a mapping defect, not a stale test.
 */
describe("consumer invariants", () => {
  it("amount is never wei-scaled, because consumers multiply it by price", () => {
    // engine/index.ts:70,72 - generateTxAssetAmountInfo:
    //   const tokenAmount = preInvestmentSnapshot.tokenAmount - postInvestmentSnapshot.tokenAmount
    //   const usdAmount = tokenAmount * postInvestmentSnapshot.price
    // where tokenAmount comes from userTokenBalanceInfo.amount (index.ts:54).
    //
    // app/api/positions/getUserPosition.ts:45 - same contract:
    //   usdValue: tokenPosition.amount * tokenPosition.price
    const amount = toHumanAmount("1000000000000000000", 18);
    expect(amount).toBe(1);
    expect(amount * 2000).toBeCloseTo(2000, 6);
  });

  it("balance survives Number(amount.toString()) as a finite value (tokenConsumptionEngine)", () => {
    // The provider stores the human amount as a STRING:
    //   goldrushProvider.ts:85  balance: amount.toString()
    // tokenConsumptionEngine.ts parses that string back:
    //   :93   parseFloat(matchingTokenBalance?.balance || "0")
    //   :177  parseFloat(currentBalance)
    //   :336  parseFloat(bufferedDebankBalance.balance) * fraction
    // A non-finite string would silently poison the whole consumption plan.
    for (const raw of ["0", "1", "1500000000000000000", "-5"]) {
      const parsed = parseFloat(toHumanAmount(raw, 18).toString());
      expect(Number.isFinite(parsed)).toBe(true);
    }
  });

  it("never emits NaN or Infinity from malformed provider input", () => {
    // GoldRush types balance as `string | null` (goldrushProvider.ts:23) and
    // can return junk. Both the engine (index.ts:72) and the consumption
    // engine (:336) do arithmetic on the result, so a NaN/Infinity would
    // propagate instead of failing closed.
    for (const raw of [null, "", "abc", "NaN"]) {
      const out = toHumanAmount(raw, 18);
      expect(Number.isFinite(out)).toBe(true);
      expect(out).toBe(0);
    }
  });

  it("handles a zero-decimals token without a divide-by-zero", () => {
    // GoldRush may report contract_decimals of 0; the provider resolves null
    // to 0 (goldrushProvider.ts:81-82) and must not scale a whole-number
    // balance. 10 ** 0 is 1, so the raw value passes through unchanged.
    expect(toHumanAmount("42", 0)).toBe(42);
  });
});
