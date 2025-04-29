import useOpportunitiesStore from "@/store/opportunities";
import { OpportunityData } from "../api/dataModels";
function useActiveOpportunity():
  | (OpportunityData & { isFavorite: boolean })
  | undefined {
  const data = useOpportunitiesStore();

  const { opportunities, activeTab, favorites } = data;

  const opportunity = opportunities.find(
    (opportunity) => opportunity.id === activeTab
  );

  if (!opportunity) {
    return undefined;
  }

  return {
    ...opportunity,
    isFavorite: favorites.includes(opportunity?.id || ""),
  };
}

export default useActiveOpportunity;
