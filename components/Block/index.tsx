import { cn } from "@/utils/classnames";
import React from "react";

function Block({
  children,
  className,
  border,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-off-black rounded-lg",
        border && "border border-solid border-block-border",
        padding && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Block;
