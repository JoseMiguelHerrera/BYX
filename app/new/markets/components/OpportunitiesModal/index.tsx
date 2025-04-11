import { OpportunityData } from "@/app/api/dataModels";
import useOpportunities from "@/app/hooks/useOpportunities";
import useTabs from "@/app/hooks/useTabs";
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
  const { add: addTab, setActive: setActiveTab } = useTabs();

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
      className={cn(
        "rounded-sm border border-solid border-modal-border bg-off-black p-6"
      )}
    >
      <div className={cn("flex flex-col gap-4")}>
        <div className={cn("text-base font-extrabold")}>Add Pool</div>

        <div className={cn("text-sm font-medium")}>Favourite Pools</div>

        <table
          cellPadding={18}
          className={cn("w-full [&_td]:pr-[18px] [&_th]:pr-[18px] [&_th]:text-left [&_td]:pb-2.5 [&_th]:pb-2.5")}
        >
          <thead>
            <tr className={cn("text-xs")}>
              <th>Assets</th>
              <th>Price</th>
              <th>Liq $</th>
              <th>Vol $</th>
              <th>Fee</th>
              <th>APR</th>
              <th className={cn("w-[150px]")}></th>
            </tr>
          </thead>
          <tbody className={cn('text-sm text-foreground-secondary')}>
            {filteredOpportunities.map((opportunity) => (
              <tr key={opportunity.id}>
                {/* Assets */}
                <td>
                  {opportunity.inputAssets
                    .map((asset) => {
                      return asset.symbol;
                    })
                    .join(", ")}
                </td>

                {/* Price */}
                <td>
                  --
                </td>

                {/* Liq $ */}
                <td>--</td>

                {/* Vol $ */}
                <td>--</td>

                {/* Fee */}
                <td>--</td>

                {/* APR */}
                <td>{opportunity.apy}%</td>

                <td className={cn("text-right pr-10")}>
                  <button
                    className={cn("text-primary font-light cursor-pointer")}
                    onClick={() => onSelect(opportunity)}
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default OpportunitiesModal;
