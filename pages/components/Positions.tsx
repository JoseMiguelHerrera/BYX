import { useState, useEffect } from "react";
import { getAccessToken } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import { UserPosition } from "@/app/api/dataModels";

interface PositionsProps {
  smartWalletAddress: string;
}

export default function Positions({ smartWalletAddress }: PositionsProps) {
  const [positionsData, setPositionsData] = useState<UserPosition[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    if (isLoading || !smartWalletAddress) return; // Prevent concurrent fetches or fetching without address
    setIsLoading(true);
    setError(null); // Reset error state on new fetch
    try {
      const accessToken = await getAccessToken();
      // Construct the URL with the query parameter
      const url = `/api/getters/getPositions?userAddress=${encodeURIComponent(smartWalletAddress)}`;

      const response = await fetch(url, {
        method: "GET", // GET request as defined in the API route
        headers: {
          // No 'Content-Type' needed for GET request without body
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        // No body needed for GET request
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || `Failed to fetch positions (status: ${response.status})`;
        toast.error(errorMessage);
        setError(errorMessage);
        setPositionsData(null);
      } else {
        setPositionsData(responseData.data); // Store the 'data' field from the response
      }
    } catch (fetchError: any) {
      console.error("Error fetching positions:", fetchError);
      const errorMessage = fetchError.message || "An unexpected error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
      setPositionsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch positions when the component mounts or smartWalletAddress changes
    fetchPositions();
  }, [smartWalletAddress]); // Dependency array ensures fetch runs when address changes

  return (
    <main className="w-full flex items-center justify-center py-10">
      <div className="max-w-4xl w-full mx-8 bg-white p-8 rounded-lg shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Positions</h1>
          <button
            onClick={fetchPositions}
            disabled={isLoading || !smartWalletAddress}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={smartWalletAddress ? "Refresh positions" : "Wallet address missing"}
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

        <div>
          {isLoading && <p>Loading positions...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && positionsData && positionsData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chain
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      USD Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime PnL (USD)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime PnL (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positionsData.map((position, index) => {
                    const amount = position.amount;
                    const displayAmount =
                      Math.abs(amount) < 1e-6 && amount !== 0 // Use scientific notation for small non-zero numbers
                        ? amount.toExponential(4) // Adjust precision (4 decimal places in mantissa) as needed
                        : amount.toFixed(8); // Use fixed notation otherwise

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {position.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {position.chain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {displayAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          $
                          {position.usdValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {position.pnlUsd === undefined ? 'N/A' : // Check if pnlUsd is undefined
                            `$${position.pnlUsd.toLocaleString(undefined, { // Format if defined
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 4,
                            })}`
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                         {position.pnlPercent === undefined ? 'N/A' : // Check if pnlPercent is undefined
                           `${(position.pnlPercent).toFixed(2)}%` // Format if defined
                         }
                       </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Handle case where data is successfully fetched but empty */}
          {!isLoading && !error && positionsData && positionsData.length === 0 && (
            <p>No position data available.</p>
          )}
          {/* Keep the initial 'no data' message for before the first fetch attempt */}
           {!isLoading && !error && !positionsData && (
            <p>No position data available.</p>
          )}
           {!smartWalletAddress && (
            <p className="text-orange-500">Please connect your wallet to see positions.</p>
          )}

          {/* Added Information Box */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 space-y-2">
            <p>
              <strong className="font-medium">Note:</strong> Currently we don't show Uniswap V3 positions here. Please visit the Uniswap position page to see position value and rewards.
            </p>
            <p>
              PnL values represent the <em className="font-medium">lifetime PnL</em> for your historical investment in a particular opportunity.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
