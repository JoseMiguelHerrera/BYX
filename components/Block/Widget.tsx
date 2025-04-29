import React from "react";
import Block from "./index";
import MoveButton from "../MoveButton";
import { cn } from "@/utils/classnames";

type WidgetBlockProps = React.ComponentProps<typeof Block> & {
  title: string;
};

const WidgetBlock = React.forwardRef<HTMLDivElement, WidgetBlockProps>(
  ({ title, children, ...props }, ref) => {
    return (
      <Block
        border
        className={cn(
          props.className,
          "flex flex-col gap-4 w-full h-full relative group"
        )}
        {...props}
        ref={ref}
      >
        <div
          className={cn(
            "text-base font-extrabold flex flex-row gap-2 items-center"
          )}
        >
          <MoveButton className={cn("drag_handler mr-2 opacity-20 group-hover:opacity-50 hover:opacity-75 transition-all duration-200")} />
          <span>{title}</span>
        </div>
        {children}
      </Block>
    );
  }
);

WidgetBlock.displayName = "WidgetBlock";
export default WidgetBlock;
