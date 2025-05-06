import { create } from "zustand";

interface PriceStore {
  prices: Record<string, number>;
  setPrices: (prices: Record<string, number>) => void;
  getPrice: (symbol: string) => number | undefined;
  getPrices: () => Record<string, number>;
  setPrice: (symbol: string, price: number) => void;
}

const usePriceStore = create<PriceStore>((set, get) => ({
  prices: {
    'FRAX': 0.9992,
    MIM: 1.0001,
    USDC: 0.9999,
    USDT: 1,
    LUSD: 0.9994,
    DAI: 0.9999,
    FDUSD: 0.9980,
  },
  setPrices: (prices: Record<string, number>) => set({ prices }),
  getPrice: (symbol: string) => get().prices[symbol],
  getPrices: () => get().prices,
  setPrice: (symbol: string, price: number) =>
    set((state) => ({ prices: { ...state.prices, [symbol]: price } })),
}));

export default usePriceStore;
