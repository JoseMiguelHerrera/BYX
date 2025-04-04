import { cn } from "@/utils/classnames";
import React from "react";

function TabItem({
  children,
  active,
  className,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'select-none',
        "flex items-center justify-center h-[53px] text-base font-extrabold text-foreground/30 cursor-pointer",
        'hover:text-foreground transition-all duration-200 border-primary',
        active && "border-b border-solid border-primary text-foreground",
        active && 'bg-linear-to-t from-[var(--color-order-panel-bottom)] to-[var(--color-order-panel-top)]  ',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default TabItem;
