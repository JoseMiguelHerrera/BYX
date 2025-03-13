import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { OpportunityData, RedeemStatus } from "../api/mockDB";
import { getAccessToken } from "@privy-io/react-auth";
import ImmediateNFTDivestModal from "./redeemModals/immediateNFTDivestModal";
import RequestAmountDivestModal from "./redeemModals/requestAmountDivestModal";
interface DivestFromOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  userAddress: string | null;
  onDivest: ((amounts: Record<string, string>) => void) | ((positionId: string) => void);
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
  onCollectRewards
}: DivestFromOpportunityModalProps) {

  if (!isOpen || !opportunity) return null;
  console.log(opportunity);

  const isImmediateWithdrawal = opportunity.immediateWithdrawal !== false;
  const opportunityWithdrawalType = opportunity.withdrawalType;

  //uniswap like
  if(isImmediateWithdrawal && opportunityWithdrawalType==="NFT"){
    return <ImmediateNFTDivestModal
      isOpen={isOpen}
      onClose={onClose}
      opportunity={opportunity}
      userAddress={userAddress}
      onDivest={onCompleteDivest as (positionId: string) => void}
      onCollectRewards={onCollectRewards}
    />
  }else if(onCompleteDivest&& !isImmediateWithdrawal && opportunityWithdrawalType==="NFT"){//Lido like
    console.log("Request amount divest");
    return <RequestAmountDivestModal
      isOpen={isOpen}
      onClose={onClose}
      opportunity={opportunity}
      userAddress={userAddress}
      onRequestDivest={onRequestDivest}
      onCompleteDivest={onCompleteDivest}
    />
  }else{
    return <div>
      <p>
        This opportunity does not support divestment.
      </p>
    </div>
  }

 

}
