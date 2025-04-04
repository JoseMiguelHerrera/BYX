import { OrderType } from "@/types";
import React from "react";
import { useMarketDetailsStore } from "../../state";
import { cn } from "@/utils/classnames";

function OrderTypes() {
  const { selectedOrderType, setSelectedOrderType } = useMarketDetailsStore();
  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 gap-0.5")}>
      {Object.values(OrderType).map((orderType) => {
        const isDisabled = orderType !== OrderType.Market;
        const isActive = selectedOrderType === orderType;
        return (
          <button
            key={orderType}
            disabled={isDisabled}
            className={cn(
              "flex items-center justify-center h-[42px] text-sm rounded-sm font-light",
              "text-foreground-secondary bg-grey-overlay/20 select-none",
              "transition-all duration-200",
              isDisabled && "cursor-not-allowed",
              !isActive &&
                !isDisabled &&
                "hover:bg-grey-overlay/40 cursor-pointer",
              isActive && "bg-primary/50 text-foreground"
            )}
            onClick={() => setSelectedOrderType(orderType)}
          >
            {orderType}
          </button>
        );
      })}
    </div>
  );
}

export default OrderTypes;
