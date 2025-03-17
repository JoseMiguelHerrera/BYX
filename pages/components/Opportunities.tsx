import { useState, useEffect } from "react";
import InvestInOpportunityModal from "./InvestInOpportunityModal";
import DivestFromOpportunityModal from "./DivestFromOpportunityModal";
import { getAccessToken, WalletWithMetadata } from "@privy-io/react-auth";
import { useDelegatedActions, usePrivy } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import { OpportunityData } from "../api/mockDB";

export interface Asset {
  name: string;
  symbol: string;
  isNative: boolean;
  address: string | null;
  priceUSD: number;
}

export default function Opportunities({
  smartWalletAddress,
}: {
  smartWalletAddress: string;
}) {
  const { user } = usePrivy();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityData | null>(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isDivestModalOpen, setIsDivestModalOpen] = useState(false);
  // const { client, getClientForChain, } = useSmartWallets();
  const { delegateWallet, revokeWallets } = useDelegatedActions();

  // Check if the wallet to delegate by inspecting the user's linked accounts
  const isAlreadyDelegated = !!user?.linkedAccounts.find(
    (account): account is WalletWithMetadata =>
      account.type === "wallet" && account.delegated,
  );

  const fetchOpportunities = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/opportunities", {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
      });

      if (!response.ok) {
        console.log(response);
        toast.error(`Failed to fetch defi opportunities`);
      }
      const data = await response.json();
      setOpportunities(data.opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const delegate = async () => {
    if (!isAlreadyDelegated) {
      try {
        await delegateWallet({
          address: smartWalletAddress,
          chainType: "ethereum",
        }); // or chainType: 'ethereum'
      } catch (e) {
        toast.error(`Failed to delegate wallet`);
      }
    }
  };

  useEffect(() => {
    fetchOpportunities();
    delegate();
  }, []);

  const handleInvest = (opportunity: OpportunityData) => {
    delegate();
    setSelectedOpportunity(opportunity);
    setIsInvestModalOpen(true);
  };

  const handleDivest = (opportunity: OpportunityData) => {
    delegate();
    setSelectedOpportunity(opportunity);
    setIsDivestModalOpen(true);
  };

  const handleInvestModalClose = () => {
    setIsInvestModalOpen(false);
    if (!isDivestModalOpen) {
      setSelectedOpportunity(null);
    }
  };

  const handleDivestModalClose = () => {
    setIsDivestModalOpen(false);
    if (!isInvestModalOpen) {
      setSelectedOpportunity(null);
    }
  };

  const handleInvestSubmit = async (amounts: Record<string, string>, range?: {min: number, max: number}) => {
    if (!selectedOpportunity) return;

    console.log("amounts");
    console.log(amounts);
    console.log("range");
    console.log(range);

    try {
      const accessToken = await getAccessToken();
      const tokenInputs = selectedOpportunity.inputAssets.map((asset) => ({
        asset,
        amount: amounts[asset.symbol] || "0",
      }));
      toast.info("Sending Investment transaction(s)... Please wait.", {
        autoClose: false,
      });


      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: smartWalletAddress,
          opportunityId: selectedOpportunity.id,
          tokenInputs,
          type: "invest",
          extraData: [range],
        }),
      });

      if (!response.ok) {
        toast.error(`Failed to get transaction`);
      }

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Transaction(s) failed: ${res.error}`);
      }

    } catch (error) {
      console.error("Error getting transaction:", error);
    } finally {
      setIsInvestModalOpen(false);
      if (!isDivestModalOpen) {
        setSelectedOpportunity(null);
      }
    }
    
  };

  const handleRequestDivestSubmit = async (amounts: Record<string, string>) => {
    if (!selectedOpportunity) return;

    try {
      const accessToken = await getAccessToken();
      const tokenInputs = selectedOpportunity.outputAssets.map((asset) => ({
        asset,
        amount: amounts[asset.symbol] || "0",
      }));
      toast.info("Sending Divestment Request transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: smartWalletAddress,
          opportunityId: selectedOpportunity.id,
          tokenInputs,
          type: "requestDivest",
        }),
      });
      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Error getting divest transaction(s):", error);
    } finally {
      setIsDivestModalOpen(false);
      if (!isInvestModalOpen) {
        setSelectedOpportunity(null);
      }
    }
  };

  //This one is for opportunities that require a request first before divesting
  const handleCompleteDivest = async (divestmentId: string) => {
    if (!selectedOpportunity) return;

    try {
      const accessToken = await getAccessToken();
      toast.info("Sending Divestment transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: smartWalletAddress,
          opportunityId: selectedOpportunity.id,
          tokenInputs: [],
          type: "divest",
          extraData: [parseInt(divestmentId)],
        }),
      });

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Error performing divestment: ${e}`);
    }
  };

  //This one is for opportunities that can divest immediately
  const handleDivestSubmit = async (amounts: Record<string, string>) => {

    console.log("amounts");
    console.log(amounts);

    if (!selectedOpportunity) return;

    const getRelevantAssets = () => {
      if (!selectedOpportunity) return [];
      return selectedOpportunity.withdrawalType === "AMOUNT_OUT" 
        ? selectedOpportunity.outputAssets 
        : selectedOpportunity.inputAssets;
    };

    try {
      const accessToken = await getAccessToken();
      const tokenInputs = getRelevantAssets().map((asset) => ({
        asset,
        amount: amounts[asset.symbol] || "0",
      }));
      toast.info("Sending Divestment transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: smartWalletAddress,
          opportunityId: selectedOpportunity.id,
          tokenInputs,
          type: "divest",
        }),
      });

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Error getting divest transaction(s):", error);
    } finally {
      setIsDivestModalOpen(false);
      if (!isInvestModalOpen) {
        setSelectedOpportunity(null);
      }
    }
  };

  const handleCollectRewards = async (divestmentId: string) => {
    if (!selectedOpportunity) return;

    try {
      const accessToken = await getAccessToken();
      toast.info("Sending Collect Rewards transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: smartWalletAddress,
          opportunityId: selectedOpportunity.id,
          tokenInputs: [],
          type: "collectRewards",
          extraData: [parseInt(divestmentId)],
        }),
      });

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Error performing divestment: ${e}`);
    }
  };


  return (
    <main className="w-full flex items-center justify-center relative">
      <div className="max-w-6xl w-full mx-8 bg-white p-8 rounded-lg shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Investment Opportunities
          </h1>
          <button
            onClick={fetchOpportunities}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white"
            title="Refresh opportunities"
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

        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opportunity Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Input Asset(s)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  APY
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.map((opportunity, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.protocol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.chain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {opportunity.inputAssets
                      .map((asset) => asset.symbol)
                      .join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {opportunity.apy.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleInvest(opportunity)}
                        disabled={!opportunity.enabled}
                        className={`py-2 px-4 rounded ${
                          opportunity.enabled
                            ? "bg-violet-600 hover:bg-violet-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {opportunity.enabled ? "Invest" : "Coming Soon"}
                      </button>
                      <button
                        onClick={() => handleDivest(opportunity)}
                        disabled={!opportunity.enabled}
                        className={`py-2 px-4 rounded ${
                          opportunity.enabled
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Divest
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isAlreadyDelegated && (
        <div className="absolute bottom-[-40px] left-8">
          <button
            onClick={() => revokeWallets()}
            className="py-1 px-3 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Remove Privy Approval
          </button>
        </div>
      )}
      <InvestInOpportunityModal
        isOpen={isInvestModalOpen}
        onClose={handleInvestModalClose}
        opportunity={selectedOpportunity}
        onInvest={handleInvestSubmit}
        userAddress={smartWalletAddress}
      />
      <DivestFromOpportunityModal
        isOpen={isDivestModalOpen}
        onClose={handleDivestModalClose}
        opportunity={selectedOpportunity}
        userAddress={smartWalletAddress}
        onDivest={handleDivestSubmit}
        onRequestDivest={handleRequestDivestSubmit}
        onCompleteDivest={handleCompleteDivest}
        onCollectRewards={handleCollectRewards}
      />
    </main>
  );
}
