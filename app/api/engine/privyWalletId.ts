const PRIVY_API_BASE = "https://api.privy.io";

const walletIdCache = new Map<string, string>();

/**
 * Resolve a wallet's Privy ID from its address.
 *
 * This exists because of how `@privy-io/server-auth` picks its RPC route: passing
 * `{ address, chainType }` resolves to `/api/v1/wallets/rpc` (the legacy
 * delegated-actions endpoint), while `{ walletId }` resolves to
 * `/api/v1/wallets/{id}/rpc` (the signer-era endpoint). The legacy route is
 * disabled on TEE-execution apps and fails with
 * `401 "Session signers are not enabled for this app"`.
 *
 * Every server-side wallet call must therefore address the wallet by ID.
 */
export async function resolvePrivyWalletId(address: string): Promise<string> {
  const cacheKey = address.toLowerCase();
  const cached = walletIdCache.get(cacheKey);
  if (cached) return cached;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing Privy environment variables");
  }

  const response = await fetch(
    `${PRIVY_API_BASE}/v1/wallets?address=${encodeURIComponent(address)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`,
        "privy-app-id": appId,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Privy wallet lookup failed (${response.status}) for ${address}`,
    );
  }

  const body = await response.json();
  const walletId = body?.data?.[0]?.id;
  if (!walletId) {
    throw new Error(`No Privy wallet found for address ${address}`);
  }

  walletIdCache.set(cacheKey, walletId);
  return walletId;
}
