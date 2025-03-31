import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { OpportunityData, RedeemStatus } from "../api/dataModels";
import { getAccessToken } from "@privy-io/react-auth";
import ImmediateNFTDivestModal from "./redeemModals/immediateNFTDivestModal";
import RequestAmountDivestModal from "./redeemModals/requestAmountDivestModal";
import ImmediateAmountDivestModal from "./redeemModals/ImmediateAmountDivestModal";
interface DivestFromOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  userAddress: string | null;
  onDivest:
    | ((amounts: Record<string, string>) => void)
    | ((positionId: string) => void);
  onRequestDivest: (amounts: Record<string, string>) => void;
  pendingDivestments?: Array<{
    id: string;
    timestamp: number;
    amounts: Record<string, string>;
  }>;
  onCompleteDivest?: (divestmentId: string) => void;
  onCollectRewards?: (positionId: string) => void;
  getDivestInfo?: (userAddress: string) => void;
}

export default function DivestFromOpportunityModal({
  isOpen,
  onClose,
  opportunity,
  userAddress,
  onDivest,
  onRequestDivest,
  onCompleteDivest,
  onCollectRewards,
}: DivestFromOpportunityModalProps) {
  console.log("DivestFromOpportunityModal called with isOpen:", isOpen);
  if (!isOpen || !opportunity) {
    console.log("Early return: !isOpen || !opportunity");
    return null;
  }
  console.log("opportunity:", opportunity);

  const isImmediateWithdrawal = opportunity.immediateWithdrawal !== false;
  console.log("isImmediateWithdrawal:", isImmediateWithdrawal);
  
  const opportunityWithdrawalType = opportunity.withdrawalType;
  console.log("opportunityWithdrawalType:", opportunityWithdrawalType);

  console.log("Checking conditions...");
  
  //uniswap like
  if (isImmediateWithdrawal && opportunityWithdrawalType === "NFT") {
    console.log("Rendering ImmediateNFTDivestModal");
    return (
      <ImmediateNFTDivestModal
        isOpen={isOpen}
        onClose={onClose}
        opportunity={opportunity}
        userAddress={userAddress}
        onDivest={onCompleteDivest as (positionId: string) => void}
        onCollectRewards={onCollectRewards as (positionId: string) => void}
      />
    );
  } else if (
    onCompleteDivest &&
    !isImmediateWithdrawal &&
    opportunityWithdrawalType === "NFT"
  ) {
    //Lido like
    console.log("Rendering RequestAmountDivestModal");
    return (
      <RequestAmountDivestModal
        isOpen={isOpen}
        onClose={onClose}
        opportunity={opportunity}
        userAddress={userAddress}
        onRequestDivest={onRequestDivest}
        onCompleteDivest={onCompleteDivest}
      />
    );
  } else if (isImmediateWithdrawal && (opportunityWithdrawalType === "AMOUNT_IN" || opportunityWithdrawalType === "AMOUNT_OUT")) {
    //Aave like
    console.log("Rendering ImmediateAmountDivestModal");
    try {
      return (
        <ImmediateAmountDivestModal
          isOpen={isOpen}
          onClose={onClose}
          opportunity={opportunity}
          userAddress={userAddress}
          onDivest={onDivest as (amounts: Record<string, string>) => void}
          onCollectRewards={onCollectRewards as (positionId: string) => void}
        />
      );
    } catch (error) {
      console.error("Error rendering ImmediateAmountDivestModal:", error);
      return <div>Error rendering divestment modal</div>;
    }
  } else {
    console.log("Rendering default 'does not support divestment' message");
    return (
      <div>
        <p>This opportunity does not support divestment.</p>
      </div>
    );
  }
}
