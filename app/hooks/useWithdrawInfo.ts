import { getAccessToken } from "@privy-io/react-auth";
import useActiveOpportunity from "./useActiveOpportunity";
import useWallet from "./useWallet";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { OpportunityData } from "../api/dataModels";

function useWithdrawInfo({
  opportunity,
  userAddress,
}: {
  opportunity?: OpportunityData;
  userAddress?: string;
}) {
  const { data: withdrawInfo, isLoading } = useQuery({
    queryKey: ["withdrawInfo", opportunity?.id || '-1', userAddress || zeroAddress],
    enabled: opportunity?.withdrawalType === "NFT" && !!opportunity?.id && !!userAddress,
    queryFn: async () => {
      if (!opportunity || !userAddress) {
        return;
      }

      const accessToken = await getAccessToken();
      const response = await fetch(
        `/api/getters/getWithdrawStatus?userAddress=${userAddress}&opportunityId=${opportunity.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined),
          },
        },
      );

      if (!response.ok) {
        toast.error(`Failed to get divestment info`);
      }

      const res = await response.json();
      return res.data;
    },
  })

  return { withdrawInfo, isLoading };
}

export default useWithdrawInfo;