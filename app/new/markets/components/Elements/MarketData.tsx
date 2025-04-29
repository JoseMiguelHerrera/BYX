import Block from "@/components/Block";
import { cn } from "@/utils/classnames";
import Image from "next/image";
import React from "react";

function MarketData() {
  return (
    <Block className="h-full w-full flex flex-col gap-4" border>
      <div className={cn("grid grid-cols-2")}>
        <div
          className={cn(
            "text-base font-extrabold flex flex-row gap-4 items-center"
          )}
        >
          <Image
            src="/images/logos/steth.svg"
            alt="stETH"
            width={32}
            height={32}
          />
          <span>stETH</span>
        </div>
        <div className={cn("justify-end flex flex-row gap-2 text-xs items-center")}>
          <span>$2,441</span>
          <span className={cn("text-red")}>-10.81%</span>
        </div>
      </div>

      <div className={cn("flex flex-col gap-2 text-xs")}>
        <div className={cn("grid grid-cols-2")}>
          <div>Volume</div>
          <div className={cn("text-right text-foreground-secondary")}>
            $54.6M
          </div>
        </div>

        <div className={cn("grid grid-cols-2")}>
          <div>Circ supply</div>
          <div className={cn("text-right text-foreground-secondary")}>
            9.41 ($22.7B)
          </div>
        </div>

        <div className={cn("grid grid-cols-2")}>
          <div>Total supply</div>
          <div className={cn("text-right text-foreground-secondary")}>
            8.26 ($18.6b)
          </div>
        </div>
      </div>
    </Block>
  );
}

export default MarketData;
