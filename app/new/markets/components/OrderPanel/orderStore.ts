import { OrderAction, OrderType } from "@/types";
import { create } from "zustand";

interface OrderStore {
  selectedAction: OrderAction;
  selectedOrderType: OrderType;
  setSelectedOrderType: (orderType: OrderType) => void;
  setSelectedAction: (action: OrderAction) => void;
  
  amounts: Record<string, string>;
  setAmountForAsset: (asset: string, amount: string | number) => void;
  range: { min: number; max: number };
  setRange: (range: { min: number; max: number }) => void;
  resetInputs: () => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

const useOrderStore = create<OrderStore>((set, get) => ({
  /** order action and order type */
  selectedOrderType: OrderType.Market,
  selectedAction: OrderAction.Deposit,
  setSelectedOrderType: (orderType: OrderType) => {
    set({ selectedOrderType: orderType });
    console.log("resetting inputs");
    get().resetInputs();
  },
  setSelectedAction: (action: OrderAction) => {
    set({ selectedAction: action });
    console.log("resetting inputs");
    get().resetInputs();
  },

  /** amounts and range */
  amounts: {},
  setAmountForAsset: (asset: string, amount: string | number) => {
    const { amounts } = get();
    const newAmounts = { ...amounts };
    newAmounts[asset] = `${amount}`;
    set({ amounts: newAmounts });
  },
  range: { min: 0, max: 0 },
  setRange: (range: { min: number; max: number }) => {
    set({ range });
  },
  resetInputs: () => {
    set({ amounts: {}, range: { min: 0, max: 0 } });
  },

  /** processing */
  isProcessing: false,
  setIsProcessing: (isProcessing: boolean) => {
    set({ isProcessing });
  },
}));

export default useOrderStore;
