import { Market } from "@/types";
import { create } from "zustand";

interface MarketStore {
  activeTab: Market;
  tabs: Market[];
  addTab: (tab: Market) => void;
  removeTab: (tab: Market) => void;
  setActiveTab: (tab: Market) => void;
}

const useMarketStore = create<MarketStore>((set) => ({
  activeTab: Market.UNISWAP,
  tabs: [Market.UNISWAP, Market.CURVE, Market.THORCHAIN],
  addTab: (tab: Market) => set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (tab: Market) =>
    set((state) => ({ tabs: state.tabs.filter((t) => t !== tab) })),
  setActiveTab: (tab: Market) => set({ activeTab: tab }),
}));

export default useMarketStore;
