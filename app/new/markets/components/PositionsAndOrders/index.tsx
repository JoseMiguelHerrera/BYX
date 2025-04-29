"use client";
import TabItem from "@/components/TabItem";
import Balances from "./Balances";
import { PositionsTab } from "@/types";
import { cn } from "@/utils/classnames";
import React from "react";

function PositionsAndOrders() {
  const [activeTab, setActiveTab] = React.useState(PositionsTab.Positions);

  const content = React.useMemo(() => {
    if (activeTab === PositionsTab.Balances) {
      return <Balances balances={[]} />;
    }
  }, [activeTab]);
  return (
    <div className={cn("flex flex-col border-black border border-solid bg-off-black rounded-sm")}>
      <div
        className={cn(
          "flex flex-row gap-2  border-b border-solid border-primary/20 ",
          "relative",
        )}
      >
        {/* <div className={cn('absolute h-[1px] bg-primary/20 bottom-0 w-full')} /> */}
        {Object.values(PositionsTab).map((tab) => (
          <TabItem
            className={cn("px-6")}
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TabItem>
        ))}
      </div>
      <div className={cn("px-4")}>{content}</div>
    </div>
  );
}

export default PositionsAndOrders;
