"use client";
import useOpportunitiesStore from "@/store/opportunities";

function useOpportunities() {
  const { opportunities, isLoading } = useOpportunitiesStore();

  return {
    opportunities,
    isLoading,
  };
}

export default useOpportunities;
