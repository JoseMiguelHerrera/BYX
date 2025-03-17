//aave
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { OpportunityData } from "../../api/mockDB";

interface ImmediateAmountDivestModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  userAddress: string | null;
  onDivest: (amounts: Record<string, string>) => void;
}

export default function ImmediateAmountDivestModal({
  isOpen,
  onClose,
  opportunity,
  userAddress,
  onDivest,
}: ImmediateAmountDivestModalProps) {
  const [assetAmounts, setAssetAmounts] = useState<Record<string, string>>({});

  // Determine which assets to use based on withdrawal type
  const getRelevantAssets = () => {
    if (!opportunity) return [];
    
    return opportunity.withdrawalType === "AMOUNT_OUT" 
      ? opportunity.outputAssets 
      : opportunity.inputAssets;
  };

  // Reset asset amounts when opportunity changes
  useEffect(() => {
    if (opportunity) {
      const initialAmounts: Record<string, string> = {};
      getRelevantAssets().forEach((asset) => {
        initialAmounts[asset.symbol] = "";
      });
      setAssetAmounts(initialAmounts);
    }
  }, [opportunity]);

  const handleAmountChange = (assetSymbol: string, value: string) => {
    setAssetAmounts((prev) => ({
      ...prev,
      [assetSymbol]: value,
    }));
  };

  if (!opportunity) return null;
  
  const relevantAssets = getRelevantAssets();

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Divest from {opportunity.name}
                </Dialog.Title>
                <div className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Protocol: {opportunity.protocol}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {opportunity.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        Chain: {opportunity.chain}
                      </p>
                      <p className="text-sm text-gray-500">
                        APY: {opportunity.apy.toFixed(2)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        Required Assets:{" "}
                        {relevantAssets
                          .map((asset) => asset.symbol)
                          .join(", ")}
                      </p>
                    </div>

                    {/* Warning box */}
                    <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Divestment Notice:</p>
                        <p>Make sure you have enough balance to divest.</p>
                      </div>
                    </div>

                    {relevantAssets.map((asset, index) => (
                      <div key={index}>
                        <label
                          htmlFor={`amount-${asset.symbol}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          {asset.name} Amount to Withdraw
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name={`amount-${asset.symbol}`}
                            id={`amount-${asset.symbol}`}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            placeholder={`Enter ${asset.symbol} amount`}
                            step="any"
                            min="0"
                            value={assetAmounts[asset.symbol] || ""}
                            onChange={(e) =>
                              handleAmountChange(asset.symbol, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={() => onDivest(assetAmounts)}
                  >
                    Divest
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
