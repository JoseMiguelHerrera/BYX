import { afterEach, describe, expect, it, vi } from "vitest";
import { base, mainnet, arbitrum, berachain } from "viem/chains";
import { resolveRpcUrl } from "@/app/api/engine/chainPicker";

describe("resolveRpcUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined when QUICKNODE_MULTICHAIN_URL is unset (fall back to viem default)", () => {
    vi.stubEnv("QUICKNODE_MULTICHAIN_URL", "");
    expect(resolveRpcUrl(mainnet)).toBeUndefined();
  });

  it("strips .{network} for ethereum mainnet (QuickNode's eth URL has no subdomain)", () => {
    vi.stubEnv(
      "QUICKNODE_MULTICHAIN_URL",
      "https://demo.{network}.quiknode.pro/token/",
    );
    expect(resolveRpcUrl(mainnet)).toBe("https://demo.quiknode.pro/token/");
  });

  it("substitutes the QuickNode network slug for other chains", () => {
    vi.stubEnv(
      "QUICKNODE_MULTICHAIN_URL",
      "https://demo.{network}.quiknode.pro/token/",
    );
    expect(resolveRpcUrl(base)).toBe(
      "https://demo.base-mainnet.quiknode.pro/token/",
    );
    expect(resolveRpcUrl(arbitrum)).toBe(
      "https://demo.arbitrum-mainnet.quiknode.pro/token/",
    );
    // Verified live: berachain's slug is `bera-mainnet`, not `berachain-mainnet`.
    expect(resolveRpcUrl(berachain)).toBe(
      "https://demo.bera-mainnet.quiknode.pro/token/",
    );
  });
});
