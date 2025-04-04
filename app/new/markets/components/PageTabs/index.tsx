"use client";
import useMarketStore from "@/store/markets";
import { cn } from "@/utils/classnames";
import Image from "next/image";
import React from "react";

function Tab({ tab, active, onClick }: { tab: string; active: boolean; onClick: () => void }) {
  return (
    <div
      className={cn(
        "w-[256px] pl-3 pr-2 py-2 h-12 uppercase flex items-center text-xs",
        "flex justify-between",
        "rounded-t-[8px] cursor-pointer",
        active && "bg-off-black",
        'transition-colors duration-300',
      )}
      onClick={onClick}
    >
      <div className={cn("text-sm text-foreground")}>{tab}</div>
      <Image
        src="/svg/close.svg"
        alt="close"
        width={16}
        height={16}
        className={cn("cursor-pointer")}
      />
    </div>
  );
}

function PageTabs() {
  const tabs = useMarketStore((state) => state.tabs);
  const activeTab = useMarketStore((state) => state.activeTab);
  const setActiveTab = useMarketStore((state) => state.setActiveTab);

  return (
    <div className={cn("flex items-center gap-2")}>
      {tabs.map((tab) => (
        <Tab key={tab} tab={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
      ))}
    </div>
  );
}

export default PageTabs;
