import { toast } from "react-toastify";
import { OpportunityData } from "../api/dataModels";
import { getAccessToken } from "@privy-io/react-auth";

function useCompleteDivest({
  opportunity,
  userAddress,
}: {
  opportunity: OpportunityData;
  userAddress: string;
}) {
  const handleCompleteDivest = async (divestmentId: string) => {
    if (!opportunity) return;

    try {
      const accessToken = await getAccessToken();
      toast.info("Sending Divestment transaction(s)... Please wait.", {
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
          type: "divest",
          extraData: [parseInt(divestmentId)],
        }),
      });

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Error performing divestment: ${e}`);
    }
  };

  return { handleCompleteDivest };
}

export default useCompleteDivest;
