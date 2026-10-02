import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import { usePortfolioAvailability } from "@/app/providers/PortfolioAvailability";
import { PORTFOLIO_UNAVAILABLE_CODE } from "@/libs/portfolioErrors";

interface BalanceData {
  chain: string;
  balance: string;
  symbol: string;
  usdValue: number;
}

const GENERIC_ERROR_MESSAGE =
  "We couldn't load your balances right now. Please try again in a moment.";

export default function Balances({
  smartWalletAddress,
}: {
  smartWalletAddress: string;
}) {
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const inFlightRef = useRef(false);
  const { reportAvailable, reportUnavailable } = usePortfolioAvailability();

  const fetchBalances = useCallback(async () => {
    if (!smartWalletAddress) return;
    if (inFlightRef.current) return; // Prevent concurrent fetches
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({ address: smartWalletAddress }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Only an explicit provider-unavailable response may gate the app.
        // Any other failure leaves availability untouched so an unrelated bug
        // cannot lock features that would otherwise work.
        const isProviderUnavailable =
          data?.code === PORTFOLIO_UNAVAILABLE_CODE;
        if (isProviderUnavailable) {
          reportUnavailable();
        }
        const message = data?.error || GENERIC_ERROR_MESSAGE;
        console.error("Failed to fetch balances:", response.status, data);
        // The provider-outage case is already shown inline and in the sidebar,
        // so a toast would be a third copy of the same message.
        if (!isProviderUnavailable) {
          toast.error(message);
        }
        setError(message);
        setBalances([]);
        return;
      }

      // A success response without an array is still a failure, not an empty
      // portfolio. Guard here so the table can never receive undefined.
      if (!Array.isArray(data?.balances)) {
        console.error("Unexpected balances payload:", data);
        toast.error(GENERIC_ERROR_MESSAGE);
        setError(GENERIC_ERROR_MESSAGE);
        setBalances([]);
        return;
      }

      // Confirmed, well-formed success: the only signal that unlocks the gate.
      reportAvailable();
      setBalances(data.balances);
    } catch (fetchError) {
      console.error("Error fetching balances:", fetchError);
      toast.error(GENERIC_ERROR_MESSAGE);
      setError(GENERIC_ERROR_MESSAGE);
      setBalances([]);
    } finally {
      inFlightRef.current = false;
      setHasFetched(true);
      setIsLoading(false);
    }
  }, [smartWalletAddress, reportAvailable, reportUnavailable]);

  useEffect(() => {
    if (smartWalletAddress) {
      fetchBalances();
    }
  }, [smartWalletAddress, fetchBalances]);

  const hasBalances = balances.length > 0;

  return (
    <main className="w-full flex items-center justify-center bg-[#1C1C1C]">
      <div className="max-w-4xl w-full mx-8 bg-white p-8 rounded-lg shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Funding Balances</h1>
          <button
            onClick={fetchBalances}
            disabled={isLoading || !smartWalletAddress}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              smartWalletAddress ? "Refresh balances" : "Wallet address missing"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.34 3.94l-8.4 14.55A1.5 1.5 0 003.24 21h17.52a1.5 1.5 0 001.3-2.25l-8.4-14.55a1.5 1.5 0 00-2.6 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Balances unavailable
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchBalances}
              disabled={isLoading}
              className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {!smartWalletAddress && (
          <p className="text-sm text-orange-500">
            Please connect your wallet to see balances.
          </p>
        )}

        {smartWalletAddress && !error && (isLoading || !hasFetched) && (
          <p className="text-sm text-gray-600">Loading balances...</p>
        )}

        {smartWalletAddress && !error && hasFetched && !isLoading && !hasBalances && (
          <p className="text-sm text-gray-600">
            No funding balances found for this wallet.
          </p>
        )}

        {smartWalletAddress && hasBalances && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USD Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balances.map((balance, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.chain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {balance.balance} {balance.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      $
                      {balance.usdValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
