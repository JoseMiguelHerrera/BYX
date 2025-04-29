import { cn } from "@/utils/classnames";
import React from "react";

type Props = {

};

const ResizeHandler = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-50',
        "absolute group-hover:opacity-50 hover:opacity-100 opacity-0 transition-opacity duration-200 bottom-0 right-0 text-white",
      )}
    >
      <div
        className={cn("w-4 h-4  border-b border-solid border-white border-r rounded-xs")}
      ></div>
    </div>
  );
});

export default ResizeHandler;
