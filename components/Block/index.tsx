import { cn } from "@/utils/classnames";
import React from "react";

type BlockProps = {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  padding?: boolean;
};

const Block = React.forwardRef<HTMLDivElement, BlockProps>(
  (
    {
      children,
      className,
      border,
      padding = true,
    }: {
      children: React.ReactNode;
      className?: string;
      border?: boolean;
      padding?: boolean;
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "bg-off-black rounded-lg",
          border && "border border-solid border-block-border",
          padding && "p-4",
          className
        )}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

export default Block;
