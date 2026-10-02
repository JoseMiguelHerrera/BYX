"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PortfolioStatus = "unknown" | "available" | "unavailable";

type PortfolioAvailabilityContextValue = {
  status: PortfolioStatus;
  /**
   * Whether provider-dependent features may be used. True only once
   * availability has been positively confirmed, so an undetermined state
   * blocks rather than allows.
   */
  isAvailable: boolean;
  reportAvailable: () => void;
  reportUnavailable: () => void;
};

const PortfolioAvailabilityContext =
  createContext<PortfolioAvailabilityContextValue | null>(null);

/**
 * Fail-closed default for consumers rendered outside the provider.
 *
 * `pages/dashboardold.tsx` renders shared components without this provider in
 * scope, and throwing here would turn a missing provider into a render crash —
 * the exact failure mode this work exists to remove. Undetermined availability
 * means blocked, so the default is "not available" and the report functions are
 * inert.
 */
const UNAVAILABLE_BY_DEFAULT: PortfolioAvailabilityContextValue = {
  status: "unknown",
  isAvailable: false,
  reportAvailable: () => {},
  reportUnavailable: () => {},
};

/**
 * Tracks whether the portfolio data provider is usable.
 *
 * The state is driven entirely by the main balances page, which is the only
 * surface that actually exercises the provider. It moves only on definitive
 * signals: a confirmed well-formed success makes it available, and an explicit
 * PORTFOLIO_UNAVAILABLE response makes it unavailable. Anything else — a bug, a
 * 500, an auth blip — leaves it untouched, so an unrelated failure can neither
 * lock a healthy app nor be mistaken for proof that the provider is fine.
 */
export function PortfolioAvailabilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<PortfolioStatus>("unknown");

  const reportAvailable = useCallback(() => setStatus("available"), []);
  const reportUnavailable = useCallback(() => setStatus("unavailable"), []);

  const value = useMemo(
    () => ({
      status,
      isAvailable: status === "available",
      reportAvailable,
      reportUnavailable,
    }),
    [status, reportAvailable, reportUnavailable],
  );

  return (
    <PortfolioAvailabilityContext.Provider value={value}>
      {children}
    </PortfolioAvailabilityContext.Provider>
  );
}

export function usePortfolioAvailability() {
  return useContext(PortfolioAvailabilityContext) ?? UNAVAILABLE_BY_DEFAULT;
}
