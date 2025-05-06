import { toast } from "react-toastify";
import { OpportunityData } from "../api/dataModels";
import { getAccessToken } from "@privy-io/react-auth";

function useCollectRewards({
  opportunity,
  userAddress,
}: {
  opportunity: OpportunityData;
  userAddress: string;
}) {
  const handleCollectRewards = async (divestmentId: string) => {
    if (!opportunity) return;

    try {
      const accessToken = await getAccessToken();
      toast.info("Sending Collect Rewards transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: userAddress,
          opportunityId: opportunity.id,
          tokenInputs: [],
          type: "collectRewards",
          extraData: [parseInt(divestmentId)],
        }),
      });

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Collect Rewards transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Collect Rewards transaction(s) failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Error performing collect rewards: ${e}`);
    }
  };

  return { handleCollectRewards };
}

export default useCollectRewards;
