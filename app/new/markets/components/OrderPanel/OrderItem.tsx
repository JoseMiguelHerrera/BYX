import { cn } from "@/utils/classnames";
import React from "react";

function OrderItem({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'select-none',
        "flex items-center justify-center h-[53px] text-base font-extrabold text-foreground/30",
        active && "border-b border-solid border-primary text-foreground",
        active && 'bg-linear-to-t from-[var(--color-order-panel-bottom)] to-[var(--color-order-panel-top)]  '
      )}
    >
      {children}
    </div>
  );
}

export default OrderItem;
