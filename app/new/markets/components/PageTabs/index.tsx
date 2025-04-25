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
        "flex justify-between whitespace-nowrap",
        "rounded-t-[8px] cursor-pointer text-foreground-secondary",
        active && "bg-off-black text-foreground",
        "transition-colors duration-300"
      )}
      onClick={onClick}
    >
      {!isLoading && <div className={cn("text-sm")}>{children}</div>}
      {isLoading && <Loader size="sm" />}
      <div className={cn("cursor-pointer pl-2 w-6")} onClick={onClose}>
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
    <div className={cn("flex items-center max-w-[100vw] relative")}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10"
        )}
      />
      <div
        className={cn(
          "absolute right-[21px] top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10"
        )}
      />
      <div
        className={cn(
          "flex items-center gap-2 overflow-x-auto pr-4 hide no-scrollbar relative"
        )}
      >
        {tabs.map((tab) => (
          <Tab
            isLoading={isLoading}
            key={`${tab.id}-${tab.name}`}
            active={activeTab?.id === tab.id}
            onClick={() => setActiveTab(tab.id)}
            onClose={() => removeTab(tab.id)}
          >
            {tab.name}
          </Tab>
        ))}
      </div>
      {!!tabs.length && (
        <div className={cn("w-[1px] h-[18px] bg-divider mx-2 flex-shrink-0")} />
      )}
      <div
        className={cn("cursor-pointer flex-shrink-0")}
        onClick={() => setShowModal(true)}
      >
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
