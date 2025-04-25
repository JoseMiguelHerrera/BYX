import { OpportunityId } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateStorageKey } from "./utils";
import GridLayout from "react-grid-layout";
import { Breakpoints } from "@/config/marketComponents";

const VERSION = "1";

interface LayoutStore {
  layouts: Record<OpportunityId, GridLayout.Layouts>;
  setLayouts: (layouts: Record<OpportunityId, GridLayout.Layouts>) => void;
  addLayoutById: (id: OpportunityId, layout: GridLayout.Layouts) => void;
  removeLayoutById: (id: OpportunityId) => void;
  updateLayoutById: (id: OpportunityId, layout: GridLayout.Layouts) => void;
  isEditing: boolean;
  setIsEditing: (resizing: boolean) => void;
  breakpoint: Breakpoints;
  setBreakpoint: (breakpoint: Breakpoints) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      isEditing: false,
      setIsEditing: (isEditing) => set({ isEditing: isEditing }),
      layouts: {},
      setLayouts: (layouts) => set({ layouts }),
      addLayoutById: (id, layouts) =>
        set((state) => ({ layouts: { ...state.layouts, [id]: layouts } })),
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
      breakpoint: "lg",
      setBreakpoint: (breakpoint) => set({ breakpoint }),
    }),
    {
      name: generateStorageKey("layouts", VERSION),
      partialize: (state) => ({ layouts: state.layouts }),
    }
  )
);
