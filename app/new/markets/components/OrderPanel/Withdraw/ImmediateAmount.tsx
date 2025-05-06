import React from "react";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import Input from "@/components/Input";
import { cn } from "@/utils/classnames";
import useOrderStore from "../orderStore";

function ImmediateAmount() {
  const { amounts, setAmountForAsset } = useOrderStore();

  const opportunity = useActiveOpportunity();

  const relevantAssets = React.useMemo(() => {
    if (!opportunity) return [];

    return opportunity.withdrawalType === "AMOUNT_OUT"
      ? opportunity.outputAssets
      : opportunity.inputAssets;
  }, [opportunity]);

  // Reset asset amounts when opportunity changes
  React.useEffect(() => {
    if (opportunity) {
      const initialAmounts: Record<string, string> = {};
      relevantAssets.forEach((asset) => {
        initialAmounts[asset.symbol] = "";
        setAmountForAsset(asset.symbol, "");
      });
    }
  }, [opportunity?.id]);

  const handleAmountChange = (assetSymbol: string, value: string) => {
    setAmountForAsset(assetSymbol, +value);
  };

  if (!opportunity) return null;

  return (
    <>
      {relevantAssets.map((asset) => (
        <div key={asset.symbol}>
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
            onChange={(e) => handleAmountChange(asset.symbol, e.target.value)}
          />
        </div>
      ))}
    </>
  );
}

export default ImmediateAmount;
