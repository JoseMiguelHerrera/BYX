export interface ChainMetadata {
  id: string;
  name: string;
  assets: Asset[];
}

export interface UserBalance {
  userId: string;
  balances: AssetBalance[]
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
}


export interface TokenInput {
  asset: Asset;
  amount: string;
}


export interface OpportunityData {
  id: string;
  name: string;
  chain: string;
  inputAssets: Asset[];
  outputAssets: Asset[];
  apy: number;
  enabled: boolean;
  immediateWithdrawal: boolean;
  type: 'Lending' | 'LP' | 'Staking';
  protocol: string;
  contractAddress: string;
}

const ETH = {
  name: 'Ethereum',
  symbol: 'ETH',
  isNative: true,
  isFundingAsset: true,
  address: null,
  priceUSD: 2700
} as Asset

const BERA = {
  name: 'Bera',
  symbol: 'BERA',
  isNative: true,
  isFundingAsset: true,
  address: null,
  priceUSD: 5.55
} as Asset

const USDC_BASIC = {
  name: 'USDC',
  symbol: 'USDC',
  isNative: false,
  isFundingAsset: true,
  address: "",
  priceUSD: 1.00
} as Asset

const USDT_BASIC = {
  name: 'USDT',
  symbol: 'USDT',
  isNative: false,
  isFundingAsset: true,
  address: "",
  priceUSD: 1.00
} as Asset

const stETH = {
  name: 'Lido Staked ETH',
  symbol: 'stETH',
  isNative: false,
  isFundingAsset: false,
  address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
  priceUSD: 2700
} as Asset

const USDC_USDT_LP_ARB={
  name: 'USDC-USDT LP',
  symbol: 'USDC-USDT LP',
  isNative: false,
  isFundingAsset: false,
  address: "",
  priceUSD: 0 // this would need to be obtained from uniswap v3
} as Asset

let USDC_ETHSEPOLIA = { ...USDC_BASIC };
USDC_ETHSEPOLIA.address = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"
let USDC_BASESEPOLIA = { ...USDC_BASIC };
USDC_BASESEPOLIA.address = "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
let USDC_ETH = { ...USDC_BASIC };
USDC_ETH.address = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

let USDT_ARBITRUM = { ...USDT_BASIC };
USDT_ARBITRUM.address = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
let USDC_ARBITRUM = { ...USDC_BASIC };
USDC_ARBITRUM.address = "0xaf88d065e77c8cc2239327c5edb3a432268e5831"

export const mockChains: ChainMetadata[] = [
  {
      id: 'ethereum',
      name: 'Ethereum',
      assets: [ //assets are the funding assets for the chain.
          ETH,
      ],
  },
  {
      id: 'ethereum-sepolia',
      name: 'Ethereum Sepolia',
      assets: [
          ETH,
          USDC_ETHSEPOLIA
      ],
  },
  {
      id: 'ethereum-holesky',
      name: 'Ethereum Holesky',
      assets: [
          ETH
      ],
  },
  {
      id: 'arbitrum',
      name: 'Arbitrum',
      assets: [
          ETH
      ],
  },
  {
      id: 'arbitrum-sepolia',
      name: 'Arbitrum Sepolia',
      assets: [
          ETH
      ],
  },
  {
      id: 'base',
      name: 'Base',
      assets: [
          ETH
      ],
  },
  {
      id: 'base-sepolia',
      name: 'Base Sepolia',
      assets: [
          ETH,
          USDC_BASESEPOLIA
      ],
  },
  {
      id: 'berachain',
      name: 'Berachain',
      assets: [
          BERA
      ],
  },
  {
      id: 'berachain-testnet',
      name: 'Berachain Testnet',
      assets: [
          BERA
      ],
  },
];

export const mockOpportunities: OpportunityData[] = [
  {
      id: "1",
      name: "ETH Staking",
      chain: "ethereum",
      inputAssets: [ETH],
      outputAssets: [stETH],
      apy: 4.8,
      enabled: true,
      immediateWithdrawal: false,
      type: "Staking",
      protocol: "Lido",
      contractAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
  },
  {
      id: "2",
      name: "Uniswap Arbitrum USDT - USDC LP",
      chain: "arbitrum",
      inputAssets: [USDT_ARBITRUM, USDC_ARBITRUM],
      outputAssets: [USDC_USDT_LP_ARB],
      apy: 2.5,
      enabled: false,
      immediateWithdrawal: true,
      type: "LP",
      protocol: "Uniswap",
      contractAddress: ""
  },
];