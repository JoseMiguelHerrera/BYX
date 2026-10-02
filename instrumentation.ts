/**
 * Next.js calls `register()` once per server process before it serves requests.
 * This is where the APY refresh loop is started so it runs with the app rather
 * than needing an external scheduler.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Next re-evaluates this module on hot reload in dev; without the guard every
  // edit would start another interval.
  const globalRef = globalThis as typeof globalThis & {
    __byxApyRefreshStarted?: boolean;
  };
  if (globalRef.__byxApyRefreshStarted) return;
  globalRef.__byxApyRefreshStarted = true;

  const { startApyRefresh } = await import("./libs/apyRefresh/service");
  startApyRefresh();
}
