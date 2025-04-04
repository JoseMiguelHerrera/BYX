import { OrderAction, OrderType } from "@/types";
import { create } from "zustand";

interface MarketDetailsState {
  selectedAction: OrderAction;
  selectedOrderType: OrderType;
  setSelectedOrderType: (orderType: OrderType) => void;
  setSelectedAction: (action: OrderAction) => void;
}

export const useMarketDetailsStore = create<MarketDetailsState>((set) => ({
  selectedOrderType: OrderType.Market,
  selectedAction: OrderAction.Deposit,
  setSelectedOrderType: (orderType: OrderType) => set({ selectedOrderType: orderType }),
  setSelectedAction: (action: OrderAction) => set({ selectedAction: action }),
}));

