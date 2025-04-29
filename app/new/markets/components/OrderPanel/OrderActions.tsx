import { OrderAction } from "@/types";
import React from "react";
import { cn } from "@/utils/classnames";
import { motion } from "motion/react";
import useOrderStore from "./orderStore";
function OrderActions() {
  const { selectedAction, setSelectedAction, isProcessing } = useOrderStore();
  return (
    <div
      className={cn(
        "grid grid-cols-3 w-full p-2 bg-grey-overlay/20 rounded-lg",
        "relative h-[42px]"
      )}
    >
      {Object.values(OrderAction).map((action) => {
        const isActive = selectedAction === action;
        const isDisabled = (action === OrderAction.Harvest) || isProcessing;
        return (
          <button
            className={cn(
              "text-sm text-foreground-secondary font-medium",
              "transition-all duration-100 cursor-pointer delay-300",
              'select-none',
              "z-10 relative",
              isActive && "text-foreground",
              isDisabled && "cursor-not-allowed"
            )}
            disabled={isDisabled}
            onClick={() => setSelectedAction(action)}
            key={action}
          >
            <div className={cn("relative z-10")}>{action}</div>
            {isActive && (
              <motion.div
                layoutId="underline"
                id="underline"
                className={cn(
                  "absolute z-0 rounded-sm bg-primary box-border w-full h-full top-0"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default OrderActions;
