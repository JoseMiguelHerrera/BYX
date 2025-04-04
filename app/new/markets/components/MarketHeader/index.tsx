'use client'
import Block from '@/components/Block'
import useMarketStore from '@/store/markets'
import { cn } from '@/utils/classnames';
import React from 'react'
import Image from 'next/image';

function MarketHeader() {
  const activeTab = useMarketStore((state) => state.activeTab);
  
  const description = `3 Token Stablecoin LP on ${activeTab}`
  const poolId = '#POOLID3434'
  return (
    <Block>
      <div className={cn("flex items-center gap-4")}>
        <span className={cn("text-sm font-extrabold text-foreground")}>{activeTab}</span>
        <Image src="/svg/star.svg" alt="Favourite" width={24} height={24} className="-mt-0.5" />
        <span className={cn("text-xs text-foreground-secondary")}>{description}</span>
        <span className={cn("text-xs text-foreground-secondary")}>{poolId}</span>
      </div>
    </Block>
  )
}

export default MarketHeader