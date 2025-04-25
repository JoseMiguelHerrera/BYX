import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useMarketLayout from "@/app/hooks/useMarketLayout";
import Dropdown from "@/components/Dropdown";
import { getComponentKey } from "@/containers/MarketComponents";
import { MarketComponent } from "@/types";
import { cn } from "@/utils/classnames";
import React from "react";

function ElementsDropdown() {
  const activeOpportunity = useActiveOpportunity();

  const { addComponent, layout, updateLayout, deleteComponent } =
    useMarketLayout(activeOpportunity);

  console.log({ layout });
  const includesIds = (layout["lg"] || []).map((x) => x.i) || [];

  const onClick = (component: MarketComponent) => {
    const isVisible = isComponentVisible(component);

    if (isVisible) {
      deleteComponent(component);
    } else {
      addComponent(component);
    }
  };

  const isComponentVisible = (component: MarketComponent) => {
    const key = getComponentKey(component);

    return includesIds.includes(key);
  };

  return (
    <Dropdown
      buttonContent="Elements"
      options={[
        {
          content: "Market Data",
          onClick: () => {
            onClick(MarketComponent.MarketData);
          },
          className: cn(
            isComponentVisible(MarketComponent.MarketData) && "opacity-50"
          ),
        },
        {
          content: "Firehose",
          onClick: () => {
            onClick(MarketComponent.Firehose);
          },
          className: cn(
            isComponentVisible(MarketComponent.Firehose) && "opacity-50"
          ),
        },
        {
          content: "Portfolio",
          onClick: () => {
            onClick(MarketComponent.Portfolio);
          },
          className: cn(
            isComponentVisible(MarketComponent.Portfolio) && "opacity-50"
          ),
        },
        {
          content: "Liquidity Pools",
          onClick: () => {
            onClick(MarketComponent.LiquidityPools);
          },
          className: cn(
            isComponentVisible(MarketComponent.LiquidityPools) && "opacity-50"
          ),
        },
      ]}
    />
  );
}

export default ElementsDropdown;
