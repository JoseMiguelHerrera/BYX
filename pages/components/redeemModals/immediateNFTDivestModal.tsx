//lido
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { OpportunityData, RedeemStatus } from "@/app/api/dataModels";
import { getAccessToken } from "@privy-io/react-auth";
import { toast } from "react-toastify";

interface ImmediateNFTDivestModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  userAddress: string | null;
  onDivest: (divestmentId: string) => void;
  onCollectRewards: (divestmentId: string) => void;
}

export default function ImmediateNFTDivestModal({
  isOpen,
  onClose,
  opportunity,
  userAddress,
  onDivest,
  onCollectRewards
}: ImmediateNFTDivestModalProps) {
  const [activeTab, setActiveTab] = useState<"complete">("complete");
  const [divestInfo, setDivestInfo] = useState<RedeemStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDivestInfo = async () => {
    if (!opportunity || !userAddress) {
      return;
    }

    try {
      setIsLoading(true);
      console.log("getDivestInfo call");
      const accessToken = await getAccessToken();
      const response = await fetch(
        `/api/getters/getWithdrawStatus?userAddress=${userAddress}&opportunityId=${opportunity.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined),
          },
        },
      );

      if (!response.ok) {
        toast.error(`Failed to get divestment info`);
      }

      const res = await response.json();
      console.log(res.data);
      setDivestInfo(res.data);
    } catch (error) {
      console.error("Error getting transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(opportunity);
    console.log(userAddress);
    if (opportunity && opportunity.withdrawalType==="NFT") {
      getDivestInfo();
    }
  }, [opportunity, userAddress]);

  
  if (!opportunity) return null;


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl min-h-[600px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Divest from {opportunity.name}
                </Dialog.Title>

               
                  <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab("complete")}
                        className={`${
                          activeTab === "complete"
                            ? "border-violet-500 text-violet-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                      >
                        Withdrawal
                      </button>
                    </nav>
                  </div>
                
                <div className="mt-4">
                  {activeTab === "complete" && (
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                      ) : !divestInfo || divestInfo.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No positions to withdraw.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Position ID
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Amount
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Request Time
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Claimable Time
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Redeemable
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Redeemed
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {divestInfo.map((status) => (
                                <tr key={status.requestId}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {status.requestId}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {status.amountRedeemed}{" "}
                                    {status.redeemedAsset.symbol}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {status.redeemRequestTimeStamp === 0
                                      ? "N/A"
                                      : new Date(
                                          status.redeemRequestTimeStamp * 1000,
                                        ).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {status.claimableTimeStamp === 0
                                      ? "N/A"
                                      : new Date(
                                          status.claimableTimeStamp * 1000,
                                        ).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        status.redeemable
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {status.redeemable ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        status.redeemed
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {status.redeemed ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                                        status.redeemable && !status.redeemed
                                          ? "bg-violet-600 text-white hover:bg-violet-700"
                                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      }`}
                                      disabled={
                                        !status.redeemable || status.redeemed
                                      }
                                      onClick={() =>
                                        onDivest &&
                                        onDivest(status.requestId)
                                      }
                                    >
                                      Finish Redeem
                                    </button>
                                    {opportunity?.hasCollectableRewards && (
                                      <button
                                        className="rounded-md px-3 py-1.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 ml-2"
                                        onClick={() =>
                                          onCollectRewards &&
                                          onCollectRewards(status.requestId)
                                        }
                                      >
                                        Get Rewards
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
