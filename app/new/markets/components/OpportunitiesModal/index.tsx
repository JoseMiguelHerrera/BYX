import { OpportunityData } from "@/app/api/dataModels";
import useOpportunities from "@/app/hooks/useOpportunities";
import { Modal } from "@/components/Modal";
import useOpportunitiesStore from "@/store/opportunities";
import { cn } from "@/utils/classnames";
import React from "react";

function OpportunitiesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { opportunities = [] } = useOpportunities();
  
  const favorites = useOpportunitiesStore((state) => state.favorites);
  const setActiveTab = useOpportunitiesStore((state) => state.setActiveTab);
  const addTab = useOpportunitiesStore((state) => state.addTab);

  const filteredOpportunities = opportunities.filter((opportunity) => {
    return favorites.includes(opportunity.id);
  });

  const onSelect = (opportunity: OpportunityData) => {
    addTab(opportunity.id);
    setActiveTab(opportunity.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={cn("rounded-xl ring-3 ring-white/20 bg-off-black p-4")}
    >
      <div>
        <h1 className={cn("text-2xl font-medium pb-2")}>Opportunities</h1>
        {filteredOpportunities.map((opportunity) => (
          <div key={opportunity.id}>
            <div  
              className={cn(
                "text-foreground-secondary hover:text-foreground duration-200 cursor-pointer py-0.5"
              )}
              onClick={() => onSelect(opportunity)}
            >
              {opportunity.name}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default OpportunitiesModal;
