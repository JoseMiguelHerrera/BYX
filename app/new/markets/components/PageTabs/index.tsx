"use client";
import { cn } from "@/utils/classnames";
import Image from "next/image";
import React, { useState } from "react";
import OpportunitiesModal from "../OpportunitiesModal";
import useTabs from "@/app/hooks/useTabs";
import Loader from "@/components/Loader";

function Tab({
  children,
  active,
  onClick,
  onClose,
  isLoading,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onClose: () => void;
  isLoading: boolean;
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
      {!isLoading && <div className={cn("text-sm")}>{children}</div>}
      {isLoading && <Loader size="sm" />}
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
  const {
    tabs,
    active: activeTab,
    remove: removeTab,
    setActive: setActiveTab,
    isLoading,
  } = useTabs();

  const [showModal, setShowModal] = useState(false);

  return (
    <div className={cn("flex items-center")}>
      <div className={cn("flex items-center gap-2")}>
        {tabs.map((tab) => (
          <Tab
            isLoading={isLoading}
            key={tab.id}
            active={activeTab?.id === tab.id}
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
