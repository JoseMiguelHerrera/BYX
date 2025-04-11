import { OpportunityId } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateStorageKey } from "./utils";
import GridLayout from "react-grid-layout";

const VERSION = "1";

interface LayoutStore {
  layouts: Record<OpportunityId, GridLayout.Layout[]>;
  setLayouts: (layouts: Record<OpportunityId, GridLayout.Layout[]>) => void;
  addLayoutById: (id: OpportunityId, layout: GridLayout.Layout[]) => void;
  removeLayoutById: (id: OpportunityId) => void;
  updateLayoutById: (id: OpportunityId, layout: GridLayout.Layout[]) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      layouts: {},
      setLayouts: (layouts) => set({ layouts }),
      addLayoutById: (id, layout) =>
        set((state) => ({ layouts: { ...state.layouts, [id]: layout } })),
      removeLayoutById: (id) =>
        set((state) => ({
          layouts: Object.fromEntries(
            Object.entries(state.layouts).filter(([key]) => key !== id)
          ),
        })),
      updateLayoutById: (id, layout) =>
        set((state) => ({
          layouts: { ...state.layouts, [id]: layout },
        })),
    }),
    {
      name: generateStorageKey("layouts", VERSION),
      partialize: (state) => ({ layouts: state.layouts }),
    }
  )
);
