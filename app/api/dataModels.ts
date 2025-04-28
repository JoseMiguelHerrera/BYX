
export interface ChainMetadata {
  id: string;
  name: string;
  debankName: string;
  assets: Asset[];
}

export interface UserBalance {
  userId: string;
  balances: AssetBalance[];
}
//I can probably join the next 2
export interface AssetBalance {
  chainId: string;
  asset: Asset;
  amount: string;
}

export interface TxAssetAmountInfo {
  assetId: string;
  tokenAmount: string;
  usdAmount: string;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  isFundingAsset: boolean;
  address: string | null;
  priceUSD: number;
  decimals: number;
  type: "ERC20" | "ERC721" | "ERC1155" | "NATIVE";
}

export interface TokenInput {
  asset: Asset;
  amount: string;
}

export interface RedeemStatus {
  requestId: string;
  redeemedAsset: Asset;
  amountRedeemed: string;
  redeemRequestTimeStamp: number;
  claimableTimeStamp: number;
  redeemable: boolean;
  redeemed: boolean;
}

export enum TransactionType {
  Invest = "invest",
  Divest = "divest",
  RequestDivest = "requestDivest",
  CollectRewards = "collectRewards",
  Withdraw = "withdraw",
  Funding = "funding",
}

export interface OpportunityContract {
  contractAddress: string;
  type: "invest" | "divest" | "UniswapV3Pool";
}

export interface OpportunityData {
  id: string;
  name: string;
  chain: string;
  inputAssets: Asset[];
  outputAssets: Asset[];
  apy: number;
  enabled: boolean;
  withdrawalType: "AMOUNT_IN" | "AMOUNT_OUT" | "NFT";
  immediateWithdrawal: boolean;
  type: "Lending" | "LP" | "Staking" | "AutoLP" | "Vault";
  protocol: string;
  hasCollectableRewards: boolean;
  contracts: OpportunityContract[];
  supportsAutoSwap: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userAddress: string;
  type: TransactionType;
  inputAssets: TxAssetAmountInfo[];
  outputAssets: TxAssetAmountInfo[];
  createdAt: number;
  opportunityId: string;
  transactionHash: string;
}

export interface UserPosition {
  name: string;
  chain: string;
  address: string;
  amount: number;
  usdValue: number;
  pnlUsd: number;
  pnlPercent: number;
}
