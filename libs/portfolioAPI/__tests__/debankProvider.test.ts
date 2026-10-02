import { describe, expect, it } from "vitest";
import { debankProvider } from "@/libs/portfolioAPI/providers/debankProvider";

describe("debankProvider", () => {
  it("identifies itself", () => {
    expect(debankProvider.name).toBe("debank");
  });

  it("supports every chain, since debankName is notNull in the schema", () => {
    expect(
      debankProvider.isChainSupported({
        id: "ethereum", name: "Ethereum", debankName: "eth", assets: [],
      }),
    ).toBe(true);
  });

  it("is not subject to the goldrush coverage flag", () => {
    expect(
      debankProvider.isChainSupported({
        id: "x", name: "X", debankName: "x", supportedByGoldrush: false, assets: [],
      }),
    ).toBe(true);
  });
});
