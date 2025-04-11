"use client";
import { cn } from "@/utils/classnames";
import Image from "next/image";
import React, { useState } from "react";
import OpportunitiesModal from "../OpportunitiesModal";
import useOpportunities from "@/app/hooks/useOpportunities";
import { OpportunityData } from "@/app/api/dataModels";
import useOpportunitiesStore from "@/store/opportunities";

function Tab({
  children,
  active,
  onClick,
  onClose,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "w-fit pl-3 pr-2 py-2 h-12 uppercase flex items-center text-xs",
        "flex justify-between",
        "rounded-t-[8px] cursor-pointer text-foreground-secondary",
        active && "bg-off-black text-foreground",
        "transition-colors duration-300"
      )}
      onClick={onClick}
    >
      <div className={cn("text-sm")}>{children}</div>
      <div className={cn("cursor-pointer pl-2")} onClick={onClose}>
        <Image
          src="/svg/close.svg"
          alt="close"
          width={16}
          height={16}
          className={cn("cursor-pointer")}
      />
      </div>
    </div>
  );
}

function PageTabs() {
  const _tabs = useOpportunitiesStore((state) => state.tabs);
  const activeTab = useOpportunitiesStore((state) => state.activeTab);
  const setActiveTab = useOpportunitiesStore((state) => state.setActiveTab);
  const removeTab = useOpportunitiesStore((state) => state.removeTab);

  const { opportunities } = useOpportunities();

  const [showModal, setShowModal] = useState(false);


  const tabs = _tabs.map((tab) => {
    const opportunity = opportunities.find((o) => o.id === tab);
    return {
      ...opportunity,
      name: opportunity?.name || tab,
    };
  }).filter(Boolean) as OpportunityData[];

  return (
    <div className={cn("flex items-center")}>
      <div className={cn("flex items-center gap-2")}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            onClose={() => removeTab(tab.id)}
          >
            {tab.name}
          </Tab>
        ))}
      </div>
      {!!tabs.length && (
        <div className={cn("w-[1px] h-[18px] bg-divider mr-2")} />
      )}
      <div className={cn("cursor-pointer")} onClick={() => setShowModal(true)}>
        <Image src="/svg/add.svg" alt="add" width={12} height={12} />
      </div>
      <OpportunitiesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default PageTabs;
