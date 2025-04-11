"use client";
import Block from "@/components/Block";
import { cn } from "@/utils/classnames";
import React from "react";
import Image from "next/image";
import useOpportunitiesStore from "@/store/opportunities";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";

import StarIcon from "@/icons/Star";

function MarketHeader() {
  const activeOpportunity = useActiveOpportunity();
  const { addFavorite, removeFavorite } = useOpportunitiesStore();

  console.log({ activeOpportunity });

  const onClickFavorite = () => {
    if (!activeOpportunity) {
      return;
    }

    if (activeOpportunity?.isFavorite) {
      removeFavorite(activeOpportunity.id);
    } else {
      activeOpportunity?.id && addFavorite(activeOpportunity.id);
    }
  };


  const description = activeOpportunity && `${activeOpportunity?.name} / ${activeOpportunity?.protocol} / ${activeOpportunity?.chain}`;

  return (
    <Block>
      <div className={cn("flex items-center gap-4")}>
        <span className={cn("text-sm font-extrabold text-foreground")}>
          {activeOpportunity?.name}
        </span>
        <div className={cn("cursor-pointer")} onClick={onClickFavorite}>
          <StarIcon
            className={cn(
              "-mt-0.5",
              "duration-200 transition-all",
              activeOpportunity?.isFavorite
                ? "fill-orange-300 [&_path]:stroke-orange-300"
                : "fill-transparent"
            )}
          />
        </div>
        <span className={cn("text-xs text-foreground-secondary")}>
          {description}
        </span>
      </div>
    </Block>
  );
}

export default MarketHeader;
