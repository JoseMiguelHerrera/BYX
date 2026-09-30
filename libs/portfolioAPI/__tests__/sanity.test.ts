import { describe, expect, it } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @ alias", async () => {
    const mod = await import("@/app/api/dataModels");
    expect(mod).toBeDefined();
  });
});
