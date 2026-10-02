import { describe, expect, it } from "vitest";
import { resolveGoldrushSlug } from "@/libs/portfolioAPI/providers/goldrushChains";

describe("resolveGoldrushSlug", () => {
  it("returns the DB column value", () => {
    // "custom-slug" is not any known slug, so this passes only if the value is read
    // from the chain rather than resolved from hardcoded knowledge.
    expect(
      resolveGoldrushSlug({
        id: "ethereum",
        name: "Ethereum",
        debankName: "eth",
        goldrushName: "custom-slug",
        assets: [],
      }),
    ).toBe("custom-slug");
  });

  it("returns null when the DB column is absent rather than guessing a slug", () => {
    expect(
      resolveGoldrushSlug({
        id: "ethereum",
        name: "Ethereum",
        debankName: "eth",
        assets: [],
      }),
    ).toBeNull();
  });

  it("returns null when the DB column is explicitly null", () => {
    expect(
      resolveGoldrushSlug({
        id: "ethereum",
        name: "Ethereum",
        debankName: "eth",
        goldrushName: null,
        assets: [],
      }),
    ).toBeNull();
  });

  it("returns null for an unknown chain rather than guessing a slug", () => {
    expect(
      resolveGoldrushSlug({
        id: "nope",
        name: "Nope",
        debankName: "nope",
        assets: [],
      }),
    ).toBeNull();
  });

  it.each([
    ["base-sepolia", "Base Sepolia"],
    ["berachain-testnet", "Berachain Testnet"],
    ["ethereum-holesky", "Ethereum Holesky"],
  ])("returns null for the deliberately excluded chain %s", (id, name) => {
    expect(resolveGoldrushSlug({ id, name, debankName: id, assets: [] })).toBeNull();
  });
});
