import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { OpportunityData } from "@/app/api/dataModels";
import React from "react";
import { getAccessToken } from "@privy-io/react-auth";
import { toast } from "react-toastify";
import { getToken1AmountFromToken0Amount, getToken0AmountFromToken1Amount } from "@/libs/uniswapAmountCalculator";

interface InvestInOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  userAddress: string;
  onInvest: (amounts: Record<string, string>, range?: { min: number, max: number }) => void;
}

export default function InvestInOpportunityModal({
  isOpen,
  onClose,
  opportunity,
  onInvest,
  userAddress
}: InvestInOpportunityModalProps) {
  // Change from ranges to range for a single token
  const [range, setRange] = useState<{ min: number; max: number } | null>(null);

  // Add state for asset amounts
  const [assetAmounts, setAssetAmounts] = useState<Record<string, string>>({});

  // Add state for loading and investment info
  const [isLoading, setIsLoading] = useState(false);
  const [investmentInfo, setInvestmentInfo] = useState<any>(null);

  // Reset asset amounts when opportunity changes
  useEffect(() => {
    if (opportunity) {
      const initialAmounts: Record<string, string> = {};
      opportunity.inputAssets.forEach((asset) => {
        initialAmounts[asset.symbol] = '';
      });
      setAssetAmounts(initialAmounts);
    }
  }, [opportunity]);

  // Initialize range when opportunity changes and investment info is available
  useEffect(() => {
    if (
      opportunity &&
      opportunity.type === "LP" &&
      !range &&
      investmentInfo?.LpPriceInfo
    ) {
      // Only initialize range for the first token
      if (opportunity.inputAssets.length > 0) {
        const asset = opportunity.inputAssets[0];
        if (asset && asset.symbol) {
          // Verify that the LpPriceInfo matches the asset symbol
          if (investmentInfo.LpPriceInfo.priceOf === asset.symbol) {
            const currentPrice = parseFloat(investmentInfo.LpPriceInfo.price);
            setRange({
              min: currentPrice * 0.5,
              max: currentPrice * 2,
            });
          } else {
            // Log error and fall back to asset.priceUSD
            toast.error(`Price info mismatch: expected ${asset.symbol}, got ${investmentInfo.LpPriceInfo.priceOf}`);
            const currentPrice = asset.priceUSD ?? 1;
            setRange({
              min: currentPrice * 0.5,
              max: currentPrice * 2,
            });
          }
        }
      }
    }
  }, [opportunity, investmentInfo, range]);

  // Fetch investment info when modal opens
  useEffect(() => {
    const fetchInvestmentInfo = async () => {
      if (!opportunity || !isOpen) return;

      try {
        setIsLoading(true);
        const accessToken = await getAccessToken();
        const response = await fetch(
          `/api/getters/getInvestmentInfo?userAddress=${userAddress}&opportunityId=${opportunity.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : undefined),
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch investment info");
          return;
        }

        const data = await response.json();
        setInvestmentInfo(data.data);
      } catch (error) {
        console.error("Error fetching investment info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestmentInfo();
  }, [opportunity, isOpen, userAddress]);

  // Handle range change
  const handleRangeChange = (
    type: "min" | "max",
    value: number,
  ) => {
    setRange((prev) => {
      if (!prev) return { min: value, max: value };

      // Ensure min doesn't exceed max and max doesn't go below min
      if (type === "min" && value > prev.max) {
        value = prev.max;
      } else if (type === "max" && value < prev.min) {
        value = prev.min;
      }

      return {
        ...prev,
        [type]: value,
      };
    });

    // Clear asset amounts when range changes
    if (opportunity) {
      const clearedAmounts: Record<string, string> = {};
      opportunity.inputAssets.forEach((asset) => {
        clearedAmounts[asset.symbol] = '';
      });
      setAssetAmounts(clearedAmounts);
    }
  };

  // Handle amount change with uniswap calculator
  const handleAmountChange = (assetIndex: number, value: string) => {
    const symbolOfAssetChanging = opportunity?.inputAssets[assetIndex]?.symbol;
    if (!symbolOfAssetChanging) {
      console.error(`No symbol found for asset index ${assetIndex}`);
      return;
    }
    //set the one we actually changed
    setAssetAmounts((prev) => ({
      ...prev,
      [symbolOfAssetChanging]: value,
    }));

    if (opportunity.type === "LP" && range) {
      //force the other field to update according to uniswap's rules
      // Get the other asset's symbol (for LP pairs)
      const otherAssetIndex = opportunity?.inputAssets.findIndex((_, idx) => idx !== assetIndex);
      const otherAssetSymbol = otherAssetIndex !== -1 ? opportunity?.inputAssets[otherAssetIndex]?.symbol : null;
      if (assetIndex === 0) {
        const token0Amount = parseFloat(value);
        const token1Amount = getToken1AmountFromToken0Amount(
          token0Amount,
          range.min,
          range.max,
          investmentInfo?.LpPriceInfo?.price
        );
        console.log(`token1Amount: ${token1Amount}`);
        if (token1Amount && otherAssetSymbol) {
          setAssetAmounts((prev) => ({
            ...prev,
            [otherAssetSymbol]: token1Amount.toString(),
          }));
        } else {
          toast.error(`Invalid amount for current range`)
        }
      } else if (assetIndex === 1) {
        const token1Amount = parseFloat(value);
        const token0Amount = getToken0AmountFromToken1Amount(
          token1Amount,
          range.min,
          range.max,
          investmentInfo?.LpPriceInfo?.price
        );
        console.log(`token0Amount: ${token0Amount}`);
        if (token0Amount && otherAssetSymbol) {
          setAssetAmounts((prev) => ({
            ...prev,
            [otherAssetSymbol]: token0Amount.toString(),
          }));
        } else {
          toast.error(`Invalid amount for current range`)
        }
      }
    }
  };

  if (!opportunity || !isOpen) return null;

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
                  Invest in {opportunity.name}
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
                        {opportunity.inputAssets
                          .map((asset) => asset.symbol)
                          .join(", ")}
                      </p>
                    </div>

                    {/* Warning box based on opportunity type */}
                    <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
                      {opportunity.type === "LP" ? (
                        <div className="text-sm text-amber-800">
                          <p className="font-medium mb-1">
                            LP Opportunity Notice:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Slippage entry coming soon</li>
                            <li>Check you actually have the correct amount of assets</li>
                          </ul>
                        </div>
                      ) : opportunity.type === "Lending" ? (
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">
                            Lending Opportunity Notice:
                          </p>
                          <p>Please enter the amount you wish to lend.</p>
                        </div>
                      ) : opportunity.type === "Staking" ? (
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">
                            Staking Opportunity Notice:
                          </p>
                          <p>Please enter the amount you wish to stake.</p>
                        </div>
                      ) : (
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">Investment Notice:</p>
                          <p>Please enter the amount you wish to invest.</p>
                        </div>
                      )}
                    </div>

                    {/* Liquidity Range Sliders for LP opportunities */}
                    {opportunity.type === "LP" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h4 className="font-medium text-gray-700">
                          Price Range
                        </h4>
                        {isLoading && (
                          <div className="text-sm text-gray-500">Loading price information...</div>
                        )}
                        {opportunity.inputAssets.length > 0 && (() => {
                          const asset = opportunity.inputAssets[0]; // Only use the first asset
                          if (!asset || !asset.symbol) return null;

                          // Use price from investmentInfo
                          const currentPrice = investmentInfo?.LpPriceInfo?.price &&
                            investmentInfo.LpPriceInfo.priceOf === asset.symbol ?
                            parseFloat(investmentInfo.LpPriceInfo.price) :
                            asset.priceUSD ?? 1;

                          const minPrice = currentPrice * 0.8;
                          const maxPrice = currentPrice * 1.2;

                          if (!range) return null;

                          return (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {asset.name} Price Range: $
                                {range.min.toFixed(2)} - $
                                {range.max.toFixed(2)}
                              </label>
                              <div className="mt-6 mb-6">
                                {/* Min slider */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">
                                    ${minPrice.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    ${currentPrice.toFixed(2)}
                                    {investmentInfo?.LpPriceInfo &&
                                      <span className="ml-1 text-xs text-gray-400">
                                        (1 {investmentInfo.LpPriceInfo.priceOf} = {investmentInfo.LpPriceInfo.price} {investmentInfo.LpPriceInfo.priceIn})
                                      </span>}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ${maxPrice.toFixed(2)}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={minPrice}
                                  max={maxPrice}
                                  step={(maxPrice - minPrice) / 100}
                                  value={range.min}
                                  onChange={(e) =>
                                    handleRangeChange(
                                      "min",
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />

                                {/* Max slider */}
                                <input
                                  type="range"
                                  min={minPrice}
                                  max={maxPrice}
                                  step={(maxPrice - minPrice) / 100}
                                  value={range.max}
                                  onChange={(e) =>
                                    handleRangeChange(
                                      "max",
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  className="form-input w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {opportunity.inputAssets.map((asset, index) => (
                      <div key={index}>
                        <label
                          htmlFor={`amount-${asset.symbol}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          {asset.name} Amount
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name={`amount-${asset.symbol}`}
                            id={`amount-${asset.symbol}`}
                            className="py-2 px-3 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
                            placeholder={`Enter ${asset.symbol} amount`}
                            step="any"
                            min="0"
                            value={assetAmounts[asset.symbol] || ''}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
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
                    onClick={() => {
                      // Include range in the onInvest call for LP opportunities
                      if (opportunity.type === "LP") {
                        onInvest(assetAmounts, range!);
                      } else {
                        onInvest(assetAmounts);
                      }
                    }}
                  >
                    Invest
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