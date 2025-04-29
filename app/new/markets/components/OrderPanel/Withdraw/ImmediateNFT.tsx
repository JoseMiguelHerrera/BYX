import { getAccessToken } from "@privy-io/react-auth";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useWallet from "@/app/hooks/useWallet";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import useWithdrawInfo from "@/app/hooks/useWithdrawInfo";

function ImmediateNFT() {
  const opportunity = useActiveOpportunity();
  const { embeddedWallet } = useWallet();
  const { withdrawInfo, isLoading } = useWithdrawInfo({
    opportunity,
    userAddress: embeddedWallet?.address,
  });
  
  return <div>ImmediateNFT</div>;
}

export default ImmediateNFT;
