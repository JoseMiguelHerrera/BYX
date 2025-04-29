import { useQuery } from "@tanstack/react-query";
import useWallet from "./useWallet";
import { OpportunityData } from "../api/dataModels";
import { getAccessToken } from "@privy-io/react-auth";
import { InvestmentInfo } from "@/types";
import { zeroAddress } from "viem";

function useInvestmentInfo(opportunity: OpportunityData | undefined): { data: InvestmentInfo | null, isLoading: boolean } {
  const { embeddedWallet } = useWallet();

  const { data: investmentInfo = null, isLoading: isInvestmentInfoLoading } = useQuery<InvestmentInfo | null>(
    {
      queryKey: [
        "investmentInfo",
        opportunity?.id || '-1',
        embeddedWallet?.address || zeroAddress,
      ],
      queryFn: async () => {
        if (!opportunity || !embeddedWallet?.address) {
          return null;
        }

        try {
          const accessToken = await getAccessToken();

          const response = await fetch(
            `/api/getters/getInvestmentInfo?userAddress=${embeddedWallet.address}&opportunityId=${opportunity.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : undefined),
              },
            }
          );

          if (!response.ok) {
            console.error("Failed to fetch investment info");
            return null
          }

          const data = await response.json() as { data: InvestmentInfo };
          return data.data;
        } catch (error) {
          console.error("Error fetching investment info:", error);
          return null;
        }
      },
    }
  );

  return { data: investmentInfo, isLoading: isInvestmentInfoLoading };
}

export default useInvestmentInfo;
