import React from "react";
import { cn } from "@/utils/classnames";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  numeric?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, numeric, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (numeric) {
        // Allow only numbers and decimals
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
          onChange?.(e);
        }
      } else {
        onChange?.(e);
      }
    };

    return (
      <div className="flex flex-col w-full gap-1">
        <input
          className={cn(
            "w-full px-4 h-[50px] rounded-sm",
            "border border-solid border-white/20", 
            "bg-color-grey-overlay/10",
            "text-foreground",
            "placeholder:text-foreground-secondary",
            "focus:border-primary",
            "transition-all duration-200",
            "outline-none",
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
