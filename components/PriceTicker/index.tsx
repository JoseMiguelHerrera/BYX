"use client";
import { cn } from "@/utils/classnames";
import React, { useState } from "react";
import Image from "next/image";
import usePriceStore from "@/store/prices";

function Price({ symbol, price }: { symbol: string; price: number }) {
  const [showImage, setShowImage] = useState(false);
  return (
    <div className={cn("flex items-center gap-2")}>
      {showImage && (
        <Image
          src={`/logos/${symbol}.svg`}
          alt={symbol}
          width={20}
          height={20}
          onLoad={() => setShowImage(true)}
          onError={() => setShowImage(false)}
        />
      )}
      <span className={cn("text-sm text-foreground")}>{symbol}</span>
      <span className={cn("text-sm text-foreground")}>{price}</span>
    </div>
  );
}

function PriceTicker() {
  const prices = usePriceStore((state) => state.prices);
  return (
    <div className={cn("flex items-center gap-5 py-[14px]")}>
      {Object.entries(prices).map(([symbol, price]) => (
        <Price key={symbol} symbol={symbol} price={price} />
      ))}
    </div>
  );
}

export default PriceTicker;
