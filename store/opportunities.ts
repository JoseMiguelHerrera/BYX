import { OpportunityData } from "@/app/api/dataModels";
import { OpportunityId } from "@/types";
import { create } from "zustand";

interface OpportunitiesStore {
  opportunities: OpportunityData[];
  setOpportunities: (opportunities: OpportunityData[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  activeTab: OpportunityId;
  tabs: OpportunityId[];
  addTab: (tab: OpportunityId) => void;
  removeTab: (tab: OpportunityId) => void;
  setActiveTab: (tab: OpportunityId) => void;

  // favorites
  favorites: OpportunityId[];
  addFavorite: (tab: OpportunityId) => void;
  removeFavorite: (tab: OpportunityId) => void;
  setFavorites: (favorites: OpportunityId[]) => void;
}

const useOpportunitiesStore = create<OpportunitiesStore>((set) => ({
  opportunities: [],
  setOpportunities: (opportunities: OpportunityData[]) =>
    set({ opportunities }),
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  activeTab: "",
  tabs: [],
  addTab: (tab: OpportunityId) =>
    set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (tab: OpportunityId) =>
    set((state) => ({ tabs: state.tabs.filter((t) => t !== tab) })),
  setActiveTab: (tab: OpportunityId) => set({ activeTab: tab }),

  // favorites
  favorites: ["1", "2", "3", "4", "5", "6", "7"],
  addFavorite: (tab: OpportunityId) =>
    set((state) => ({ favorites: [...state.favorites, tab] })),
  removeFavorite: (tab: OpportunityId) =>
    set((state) => ({ favorites: state.favorites.filter((t) => t !== tab) })),
  setFavorites: (favorites: OpportunityId[]) => set({ favorites }),
}));

export default useOpportunitiesStore;
