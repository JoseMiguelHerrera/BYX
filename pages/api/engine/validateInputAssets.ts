import { TokenInput,OpportunityData } from "../mockDB";

export async function genericValidate(opportunity: OpportunityData, tokenInputs: TokenInput[]) {
    if (tokenInputs.length !== opportunity.inputAssets.length) {
      throw new Error('Mismatch between opportunity input assets and token inputs (length)');
    }
  
    for (const opportunityInputAsset of opportunity.inputAssets) {
      const tokenInput = tokenInputs.find(tokenInput => 
        tokenInput.asset.address === opportunityInputAsset.address &&
        tokenInput.asset.name === opportunityInputAsset.name &&
        tokenInput.asset.symbol === opportunityInputAsset.symbol &&
        tokenInput.asset.isNative === opportunityInputAsset.isNative &&
        tokenInput.asset.isFundingAsset === opportunityInputAsset.isFundingAsset
      );
      
      if (!tokenInput) {
        throw new Error('Token input asset does not match opportunity asset properties (address, name, symbol, isNative, isFundingAsset)');
      }
    }
  }