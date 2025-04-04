'use client'
import TabItem from "@/components/TabItem";
import { PositionsTab } from "@/types";
import { cn } from "@/utils/classnames";
import React from "react";

function PositionsAndOrders() {
  const [activeTab, setActiveTab] = React.useState(PositionsTab.Positions);
  return (
    <div className={cn("flex flex-col")}>
      <div
        className={cn(
          "flex flex-row gap-2 bg-off-black rounded-sm border-black border border-solid"
        )}
      >
        {Object.values(PositionsTab).map((tab) => (
          <TabItem
            className={cn('px-6')}
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TabItem>
        ))}
      </div>
    </div>
  );
}

export default PositionsAndOrders;
