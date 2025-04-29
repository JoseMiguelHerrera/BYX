import React, { useState } from "react";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useInvestmentInfo from "@/app/hooks/useInvestmentInfo";
import { toast } from "react-toastify";
import Input from "@/components/Input";
import { cn } from "@/utils/classnames";
import {
  getToken1AmountFromToken0Amount,
  getToken0AmountFromToken1Amount,
} from "@/libs/uniswapAmountCalculator";
import useOrderStore from "./orderStore";

function DepositInputs() {
  const opportunity = useActiveOpportunity();
  // Add state for asset amounts
  const { amounts, setAmountForAsset, range, setRange } = useOrderStore();
  const { data: investmentInfo, isLoading: isInvestmentInfoLoading } =
    useInvestmentInfo(opportunity);

  const handleRangeChange = (type: "min" | "max", value: number) => {
    setRange({ ...range, [type]: value });
  };

  // Initialize range when opportunity changes and investment info is available
  React.useEffect(() => {
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
            toast.error(
              `Price info mismatch: expected ${asset.symbol}, got ${investmentInfo.LpPriceInfo.priceOf}`
            );
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

  const handleAmountChange = (assetIndex: number, value: string) => {
    const symbolOfAssetChanging = opportunity?.inputAssets[assetIndex]?.symbol;
    if (!symbolOfAssetChanging) {
      console.error(`No symbol found for asset index ${assetIndex}`);
      return;
    }
    //set the one we actually changed
    setAmountForAsset(symbolOfAssetChanging, parseFloat(value));

    if (opportunity.type === "LP" && range) {
      //force the other field to update according to uniswap's rules
      // Get the other asset's symbol (for LP pairs)
      const otherAssetIndex = opportunity?.inputAssets.findIndex(
        (_, idx) => idx !== assetIndex
      );
      const otherAssetSymbol =
        otherAssetIndex !== -1
          ? opportunity?.inputAssets[otherAssetIndex]?.symbol
          : null;
      if (assetIndex === 0) {
        const token0Amount = parseFloat(value);
        const token1Amount = getToken1AmountFromToken0Amount(
          token0Amount,
          range.min,
          range.max,
          +(investmentInfo?.LpPriceInfo?.price || 0)
        );
        console.log(`token1Amount: ${token1Amount}`);
        if (token1Amount && otherAssetSymbol) {
          setAmountForAsset(otherAssetSymbol, token1Amount);
        } else {
          toast.error(`Invalid amount for current range`);
        }
      } else if (assetIndex === 1) {
        const token1Amount = parseFloat(value);
        const token0Amount = getToken0AmountFromToken1Amount(
          token1Amount,
          range.min,
          range.max,
          +(investmentInfo?.LpPriceInfo?.price || 0)
        );
        console.log(`token0Amount: ${token0Amount}`);
        if (token0Amount && otherAssetSymbol) {
          setAmountForAsset(otherAssetSymbol, token0Amount);
        } else {
          toast.error(`Invalid amount for current range`);
        }
      }
    }
  };

  const priceRangeComponent = React.useMemo(() => {
    if (opportunity?.type !== "LP") {
      return null;
    }
    const asset = opportunity?.inputAssets[0]; // Only use the first asset
    if (!asset || !asset.symbol) {
      return null;
    }

    // Use price from investmentInfo
    const currentPrice =
      investmentInfo?.LpPriceInfo?.price &&
      investmentInfo.LpPriceInfo.priceOf === asset.symbol
        ? parseFloat(investmentInfo.LpPriceInfo.price)
        : asset.priceUSD ?? 1;

    const minPrice = currentPrice * 0.8;
    const maxPrice = currentPrice * 1.2;

    if (!range) { return null; }

    return (
      <div className="space-y-2 relative z-10">
        <label className="flex  flex-col text-sm font-medium text-foreground-secondary items-center">
          {asset.name} Price Range: ${range.min.toFixed(2)} - $
          {range.max.toFixed(2)}
          <br />
          {investmentInfo?.LpPriceInfo && (
            <span className="ml-1 text-xs text-foreground-secondary">
              (1 {investmentInfo.LpPriceInfo.priceOf} ={" "}
              {investmentInfo.LpPriceInfo.price}{" "}
              {investmentInfo.LpPriceInfo.priceIn})
            </span>
          )}
        </label>
        <div className="mt-6 mb-6">
          {/* Min slider */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-foreground">
              ${minPrice.toFixed(2)}
            </span>
            <span className="text-xs text-foreground font-medium">
              ${currentPrice.toFixed(2)}
            </span>
            <span className="text-xs text-foreground">
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
              handleRangeChange("min", parseFloat(e.target.value))
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
              handleRangeChange("max", parseFloat(e.target.value))
            }
            className="form-input w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4"
          />
        </div>
      </div>
    );
  }, [investmentInfo, range, opportunity]);
  return (
    <div className={cn("relative z-10")}>
      <div className="space-y-2 w-full">{priceRangeComponent}</div>
      <div className={cn("flex flex-col gap-4")}>
        {opportunity?.inputAssets.map((asset, index) => (
          <div key={index}>
            <span className={cn("text-sm text-foreground-secondary")}>
              {asset.symbol}
            </span>
            <Input
              min={0}
              name={`amount-${asset.symbol}`}
              id={`amount-${asset.symbol}`}
              placeholder={`Enter ${asset.symbol} amount`}
              numeric
              value={amounts[asset.symbol] ?? ""}
              onChange={(e) => handleAmountChange(index, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DepositInputs;
