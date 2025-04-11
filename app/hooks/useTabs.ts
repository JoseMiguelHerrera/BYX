import { useLayoutStore } from "@/store/layout";
import useOpportunitiesStore from "@/store/opportunities";
import { OpportunityId } from "@/types";
import { OpportunityData } from "../api/dataModels";

function useTabs() {
  const {
    opportunities,
    activeTab: _activeTab,
    tabs: _tabs,
    addTab: _addTab,
    removeTab: _removeTab,
    setActiveTab: _setActiveTab,
    isLoading,
  } = useOpportunitiesStore();

  const { removeLayoutById } = useLayoutStore();

  const addTab = (tab: OpportunityId) => {
    if (_tabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }

    _addTab(tab);
  };

  const removeTab = (tab: OpportunityId) => {
    _removeTab(tab);
    removeLayoutById(tab);
  };

  const setActiveTab = (tab: OpportunityId) => {
    _setActiveTab(tab);
  };

  const tabs = _tabs
    .map((tab) => {
      const opportunity = opportunities.find((o) => o.id === tab);
      return {
        ...(opportunity || {}),
        name: opportunity?.name || tab,
      };
    })
    .filter(Boolean) as OpportunityData[];

  const activeOpportunity = opportunities.find((o) => o.id === _activeTab);

  return {
    tabs,
    active: activeOpportunity,
    add: addTab,
    remove: removeTab,
    setActive: setActiveTab,
    isLoading,
  };
}

export default useTabs;
