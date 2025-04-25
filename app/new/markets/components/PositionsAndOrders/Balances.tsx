import { cn } from "@/utils/classnames";
import { decimalFormatter, usdFormatter } from "@/utils/numbers";
import Image from "next/image";
import React, { useState } from "react";

interface BalancesProps {
  balances: {
    symbol: string;
    total: number;
    available: number;
    pnl: number;
  }[];
}

function Row({ item }: { item: BalancesProps["balances"][0] }) {
  const [showLogo, setShowLogo] = useState(true);
  return (
    <tr className={cn("[&_td]:pb-4")}>
      <td className={cn("text-sm")}>
        <div className={cn("flex items-center gap-2")}>
          {showLogo ? (
            <Image
              width={16}
              height={16}
              src={`/images/logos/${item.symbol?.toLowerCase()}.svg`}
              alt={item.symbol}
              className={cn("w-4 h-4")}
              onError={() => setShowLogo(true)}
            />
          ) : (
            <div
              className={cn("w-4 h-4 bg-foreground-secondary rounded-full")}
            />
          )}
          {item.symbol}
        </div>
      </td>
      <td className={cn("text-xs font-light text-foreground-secondary")}>
        {decimalFormatter.format(item.total)}
      </td>
      <td className={cn("text-xs font-light text-green")}>
        {decimalFormatter.format(item.available)}
      </td>
      <td className={cn("text-xs font-light text-foreground-secondary")}>
        {usdFormatter.format(item.total)}
      </td>
      <td
        className={cn(
          "text-right text-xs font-light text-foreground-secondary"
        )}
      >
        {usdFormatter.format(item.pnl)}
      </td>
    </tr>
  );
}

function Balances(props: BalancesProps) {
  const data: BalancesProps["balances"] = [
    {
      symbol: "USDT",
      total: 1000,
      available: 800,
      pnl: 200,
    },
    {
      symbol: "USDC",
      total: 1000,
      available: 800,
      pnl: 200,
    },
  ];
  return (
    <table className={cn("px-4 w-full")}>
      <thead className={cn("[&_th]:py-4 [&_th]:text-xs [&_th]:font-medium")}>
        <tr>
          <th className={cn("text-left")}>Coin</th>
          <th className={cn("text-left")}>Total Balance</th>
          <th className={cn("text-left")}>Available Balance</th>
          <th className={cn("text-left")}>USD Value</th>
          <th className={cn("text-right")}>PNL (ROE%)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <Row key={item.symbol} item={item} />
        ))}
      </tbody>
    </table>
  );
}

export default Balances;
