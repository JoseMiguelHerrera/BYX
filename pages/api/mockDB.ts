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

export interface AssetBalance {
  chainId: string;
  asset: Asset;
  amount: string;
}

export interface Asset {
  name: string;
  symbol: string;
  isNative: boolean;
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
}

const ETH = {
  name: "Ethereum",
  symbol: "ETH",
  isNative: true,
  isFundingAsset: true,
  address: null,
  priceUSD: 2700,
  decimals: 18,
  type: "NATIVE",
} as Asset;

const BERA = {
  name: "Bera",
  symbol: "BERA",
  isNative: true,
  isFundingAsset: true,
  address: null,
  priceUSD: 5.55,
  decimals: 18,
  type: "NATIVE",
} as Asset;

const USDC_BASIC = {
  name: "USDC",
  symbol: "USDC",
  isNative: false,
  isFundingAsset: true,
  address: "",
  priceUSD: 1.0,
  decimals: 6,
  type: "ERC20",
} as Asset;

const USDT_BASIC = {
  name: "USDT",
  symbol: "USDT",
  isNative: false,
  isFundingAsset: true,
  address: "",
  priceUSD: 1.0,
  decimals: 6,
  type: "ERC20",
} as Asset;

const WETH_BASIC = {
  name: "Wrapped Ethereum",
  symbol: "WETH",
  isNative: false,
  isFundingAsset: true,
  address: null,
  priceUSD: 2226.21,
  decimals: 18,
  type: "ERC20",
} as Asset;

const stETH_Ethereum = {
  name: "Lido Staked ETH",
  symbol: "stETH",
  isNative: false,
  isFundingAsset: false,
  address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
  priceUSD: 2700,
  decimals: 18,
  type: "ERC20",
} as Asset;

const WETH_USDC_LP_ARB = {
  name: "WETH-USDC LP",
  symbol: "WETH-USDC LP",
  isNative: false,
  isFundingAsset: false,
  address: "", //TODO: add address
  priceUSD: 0, // this would need to be obtained from uniswap v3
  decimals: 0,
  type: "ERC721",
} as Asset;

const WETH_HONEY_LP_BERACHAIN = {
  name: "WETH-HONEY LP",
  symbol: "WETH-HONEY LP",
  isNative: false,
  isFundingAsset: false,
  address: "0xFE5E8C83FFE4d9627A75EaA7Fee864768dB989bD",
  priceUSD: 0, // this would need to be obtained from uniswap v3
  decimals: 0,
  type: "ERC721",
} as Asset;


const WETH_HONEY_ISLAND_BERACHAIN = {
  name: "Kodiak Island WETH-HONEY-0.3%",
  symbol: "KODI WETH-HONEY",
  isNative: false,
  isFundingAsset: false,
  address: "0xf6c6Be0FF6d6F70A04dBE4F1aDE62cB23053Bd95",
  priceUSD: 0, // this would need to be obtained from uniswap v3
  decimals: 18,
  type: "ERC20",
} as Asset;


const aARBWETH = {
  name: "Aave Arbitrum WETH",
  symbol: "aArbWETH",
  isNative: false,
  isFundingAsset: false,
  address: "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8",
  priceUSD: 1850,
  decimals: 18,
  type: "ERC20",
} as Asset;

const aARBUSDC = {
  name: "Aave Arbitrum USDC",
  symbol: "aArbUSDCn",
  isNative: false,
  isFundingAsset: false,
  address: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
  priceUSD: 1,
  decimals: 6,
  type: "ERC20",
} as Asset;

const HONEY_BERACHAIN = {
  name: "Honey",
  symbol: "HONEY",
  isNative: false,
  isFundingAsset: true,
  address: "0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce",
  priceUSD: 1,
  decimals: 18,
  type: "ERC20",
} as Asset;



let USDC_ETH = { ...USDC_BASIC };
USDC_ETH.address = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

let USDT_ARBITRUM = { ...USDT_BASIC };
USDT_ARBITRUM.address = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
let USDC_ARBITRUM = { ...USDC_BASIC };
USDC_ARBITRUM.address = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

let WETH_ARBITRUM = { ...WETH_BASIC };
WETH_ARBITRUM.address = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

let WETH_BERACHAIN = { ...WETH_BASIC };
WETH_BERACHAIN.address = "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590";

export const mockChains: ChainMetadata[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    debankName: "eth",
    assets: [
      //assets are the funding assets for the chain.
      ETH,
    ],
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    debankName: "arb",
    assets: [ETH, USDC_ARBITRUM, WETH_ARBITRUM],
  },
  {
    id: "base",
    name: "Base",
    debankName: "base",
    assets: [ETH],
  },
  {
    id: "berachain",
    name: "Berachain",
    debankName: "bera",
    assets: [BERA,HONEY_BERACHAIN],
  },
];

export const mockOpportunities: OpportunityData[] = [
  {
    id: "1",
    name: "ETH Staking",
    chain: "ethereum",
    inputAssets: [ETH],
    outputAssets: [stETH_Ethereum],
    apy: 4.8,
    enabled: true,
    immediateWithdrawal: false,
    withdrawalType: "NFT",
    type: "Staking",
    protocol: "Lido",
    hasCollectableRewards: false,
    contracts: [
      {
        contractAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        type: "invest",
      },
      {
        contractAddress: "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1",
        type: "divest",
      },
    ],
  },
  {
    id: "2",
    name: "Uniswap Arbitrum WETH - USDC LP",
    chain: "arbitrum",
    inputAssets: [WETH_ARBITRUM, USDC_ARBITRUM],//weth token is token0, usdc token is token1
    outputAssets: [WETH_USDC_LP_ARB],
    apy: 105,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "NFT",
    type: "LP",
    protocol: "Uniswap",
    hasCollectableRewards: true,
    contracts: [
      {
        contractAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        type: "invest",
      },
      {
        contractAddress: "0xC6962004f452bE9203591991D15f6b388e09E8D0",
        type: "UniswapV3Pool",
      },
    ],
  },
  {
    id: "3",
    name: "Aave V3 ETH Supply",
    chain: "arbitrum",
    inputAssets: [WETH_ARBITRUM],
    outputAssets: [aARBWETH],
    apy: 3.5,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "AMOUNT_IN",
    type: "Lending",
    protocol: "Aave",
    hasCollectableRewards: false,
    contracts: [
      {
        contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        type: "invest",
      },
    ],
  },
  {
    id: "4",
    name: "Aave V3 USDC Supply",
    chain: "arbitrum",
    inputAssets: [USDC_ARBITRUM],
    outputAssets: [aARBUSDC],
    apy: 5,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "AMOUNT_IN",
    type: "Lending",
    protocol: "Aave",
    hasCollectableRewards: false,
    contracts: [
      {
        contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        type: "invest",
      },
    ],
  },
  {
    id: "5",
    name: "Kodiak Berachain WETH - HONEY V3 LP",
    chain: "berachain",
    inputAssets: [WETH_BERACHAIN, HONEY_BERACHAIN],
    outputAssets: [WETH_HONEY_LP_BERACHAIN],
    apy: 40,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "NFT",
    type: "LP",
    protocol: "Kodiak",
    hasCollectableRewards: true,
    contracts: [
      {
        contractAddress: "0xFE5E8C83FFE4d9627A75EaA7Fee864768dB989bD",
        type: "invest",
      },
      {
        contractAddress: "0x9EB897D400f245E151daFD4c81176397D7798C9c",
        type: "UniswapV3Pool",
      },
    ],
  },
  {
    id: "6",
    name: "Kodiak Berachain WETH - HONEY Island LP",
    chain: "berachain",
    inputAssets: [WETH_BERACHAIN, HONEY_BERACHAIN],
    outputAssets: [WETH_HONEY_ISLAND_BERACHAIN],
    apy: 40,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "AMOUNT_OUT",
    type: "AutoLP",
    protocol: "Kodiak",
    hasCollectableRewards: false,//TODO: research if this is true or not.
    contracts: [
      {
        contractAddress: "0x679a7C63FC83b6A4D9C1F931891d705483d4791F",//Island Router
        type: "invest",
      }
    ],
  },
  {
    id: "7",
    name: "Infrared Berachain WETH - HONEY Island LP Vault",
    chain: "berachain",
    inputAssets: [WETH_HONEY_ISLAND_BERACHAIN],
    outputAssets: [],
    apy: 0,
    enabled: true,
    immediateWithdrawal: true,
    withdrawalType: "AMOUNT_OUT",
    type: "Vault",
    protocol: "Infrared",
    hasCollectableRewards: true,
    contracts: [
      {
        contractAddress: "0xba802c7233db63353151798662893ff2ed52cf33",
        type: "invest",
      }
    ],
  },
];
