import { OrderType } from "@/types";
import React from "react";
import { cn } from "@/utils/classnames";
import useOrderStore from "./orderStore";

function OrderTypes() {
  const { selectedOrderType, setSelectedOrderType, isProcessing } =
    useOrderStore();
  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 gap-0.5")}>
      {Object.values(OrderType).map((orderType) => {
        const isDisabled = orderType !== OrderType.Market || isProcessing;
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
