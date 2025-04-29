import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import React from "react";
import ImmediateAmount from "./ImmediateAmount";

function WithdrawInputs() {
  const opportunity = useActiveOpportunity();

  if (!opportunity) {
    return null;
  }

  const onCompleteDivest = () => {
    console.log("onCompleteDivest called");
  };

  const isImmediateWithdrawal = opportunity.immediateWithdrawal !== false;
  console.log("isImmediateWithdrawal:", isImmediateWithdrawal);

  const opportunityWithdrawalType = opportunity.withdrawalType;
  console.log("opportunityWithdrawalType:", opportunityWithdrawalType);

  console.log("Checking conditions...");

  if (isImmediateWithdrawal && opportunityWithdrawalType === "NFT") {
    // return <ImmediateNFT />;
    return <>not available yet.</>
  }

  if (
    onCompleteDivest &&
    !isImmediateWithdrawal &&
    opportunityWithdrawalType === "NFT"
  ) {
    // return <RequestAmount />;
    return <>not available yet.</>
  }

  if (
    isImmediateWithdrawal &&
    (opportunityWithdrawalType === "AMOUNT_IN" ||
      opportunityWithdrawalType === "AMOUNT_OUT")
  ) {
    return <ImmediateAmount />;
  }

  return (
    <div>
      <p>This opportunity does not support divestment.</p>
    </div>
  );
}

export default WithdrawInputs;
