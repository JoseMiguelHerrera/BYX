"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrivy, useSigners, WalletWithMetadata } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import AppAccessModal, {
  type AppAccessAction,
  type AppAccessMode,
} from "@/pages/components/AppAccessModal";

const SIGNER_ID = process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID;

const POLICY_IDS = (process.env.NEXT_PUBLIC_PRIVY_SIGNER_POLICY_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

type AppAccessContextValue = {
  /** True once the wallet carries our additional signer. */
  hasAccess: boolean;
  /** Resolves true if access is already granted, or the user grants it now. */
  requireAccess: (action: AppAccessAction) => Promise<boolean>;
  /** Opens the revoke confirmation. */
  requestRevoke: () => void;
};

const AppAccessContext = createContext<AppAccessContextValue | null>(null);

/**
 * Fail-closed default for consumers rendered outside the provider. Undetermined
 * access means denied, so a missing provider blocks rather than silently
 * granting server-side authority over the user's wallet.
 */
const DENIED_BY_DEFAULT: AppAccessContextValue = {
  hasAccess: false,
  requireAccess: async () => false,
  requestRevoke: () => {},
};

export function AppAccessProvider({ children }: { children: ReactNode }) {
  const { user } = usePrivy();
  const { addSigners, removeSigners } = useSigners();

  const [prompt, setPrompt] = useState<{
    mode: AppAccessMode;
    action: AppAccessAction;
  } | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const resolveRef = useRef<((ok: boolean) => void) | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  const wallet = user?.linkedAccounts?.find(
    (account): account is WalletWithMetadata =>
      account.type === "wallet" && "id" in account,
  );
  const address = wallet?.address ?? null;
  const hasAccess = !!wallet?.delegated;

  const settle = useCallback((ok: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    inFlightRef.current = null;
    setPrompt(null);
    setIsWorking(false);
    resolve?.(ok);
  }, []);

  const openPrompt = useCallback(
    (mode: AppAccessMode, action: AppAccessAction): Promise<boolean> => {
      const pending = new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
      inFlightRef.current = pending;
      setPrompt({ mode, action });
      return pending;
    },
    [],
  );

  const requireAccess = useCallback(
    (action: AppAccessAction): Promise<boolean> => {
      if (hasAccess) return Promise.resolve(true);

      if (!SIGNER_ID) {
        toast.error(
          "Wallet access is not configured (NEXT_PUBLIC_PRIVY_SIGNER_ID).",
        );
        return Promise.resolve(false);
      }
      if (!address) {
        toast.error("No embedded wallet found for this account.");
        return Promise.resolve(false);
      }

      // React strict mode double-invokes effects in dev; reuse the in-flight
      // attempt so only one consent prompt is ever open.
      if (inFlightRef.current) return inFlightRef.current;

      return openPrompt("grant", action);
    },
    [hasAccess, address, openPrompt],
  );

  const handleGrant = useCallback(async () => {
    if (!address || !SIGNER_ID) {
      settle(false);
      return;
    }
    setIsWorking(true);
    try {
      await addSigners({
        address,
        signers: [{ signerId: SIGNER_ID, policyIds: POLICY_IDS }],
      });
      settle(true);
    } catch (error) {
      console.error("Failed to provision signer:", error);
      toast.error(
        error instanceof Error
          ? `Could not grant wallet access: ${error.message}`
          : "Could not grant wallet access.",
      );
      settle(false);
    }
  }, [address, addSigners, settle]);

  const requestRevoke = useCallback(() => {
    if (!address) return;
    if (inFlightRef.current) return;
    openPrompt("revoke", "invest");
  }, [address, openPrompt]);

  const handleRevoke = useCallback(async () => {
    if (!address) {
      settle(false);
      return;
    }
    setIsWorking(true);
    try {
      await removeSigners({ address });
      toast.success(
        "Wallet access removed. You'll be asked again before your next withdrawal.",
      );
      settle(true);
    } catch (error) {
      console.error("Failed to remove signer:", error);
      toast.error(
        error instanceof Error
          ? `Could not remove wallet access: ${error.message}`
          : "Could not remove wallet access.",
      );
      settle(false);
    }
  }, [address, removeSigners, settle]);

  const value = useMemo(
    () => ({ hasAccess, requireAccess, requestRevoke }),
    [hasAccess, requireAccess, requestRevoke],
  );

  return (
    <AppAccessContext.Provider value={value}>
      {children}
      <AppAccessModal
        isOpen={prompt !== null}
        mode={prompt?.mode ?? "grant"}
        action={prompt?.action ?? "invest"}
        isWorking={isWorking}
        onAllow={prompt?.mode === "revoke" ? handleRevoke : handleGrant}
        onDecline={() => settle(false)}
      />
    </AppAccessContext.Provider>
  );
}

export function useAppAccess() {
  return useContext(AppAccessContext) ?? DENIED_BY_DEFAULT;
}
