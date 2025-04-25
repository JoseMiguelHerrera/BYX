import useOpportunitiesStore from "@/store/opportunities";

function useActiveOpportunity() {
  const data = useOpportunitiesStore();

  const { opportunities, activeTab, favorites } = data

  const opportunity = opportunities.find((opportunity) => opportunity.id === activeTab);

  if (!opportunity) {
    return undefined;
  }

  return {
    ...opportunity,
    isFavorite: favorites.includes(opportunity?.id || ""),
  };
}

export default useActiveOpportunity;
