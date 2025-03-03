import { TokenInput, OpportunityData } from "../mockDB";

export async function genericValidateTokenInputs(
  opportunity: OpportunityData,
  tokenInputs: TokenInput[],
  validationMode: "INVEST" | "REDEEM",
) {
  const validationAssetsDataset =
    validationMode === "INVEST"
      ? opportunity.inputAssets
      : opportunity.outputAssets;

  if (tokenInputs.length !== validationAssetsDataset.length) {
    throw new Error(
      "Mismatch between opportunity input assets and token inputs (length)",
    );
  }

  for (const opportunityAsset of validationAssetsDataset) {
    const tokenInput = tokenInputs.find(
      (tokenInput) =>
        tokenInput.asset.address === opportunityAsset.address &&
        tokenInput.asset.name === opportunityAsset.name &&
        tokenInput.asset.symbol === opportunityAsset.symbol &&
        tokenInput.asset.isNative === opportunityAsset.isNative &&
        tokenInput.asset.isFundingAsset === opportunityAsset.isFundingAsset,
    );

    if (!tokenInput) {
      throw new Error(
        "Token input asset does not match opportunity asset properties (address, name, symbol, isNative, isFundingAsset)",
      );
    }
  }
}
