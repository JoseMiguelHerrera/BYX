export interface ChainMetadata {
    id: string;
    name: string;
    assets: Asset[];
  }

  export interface Asset {
    name: string;
    symbol: string;
    isNative: boolean;
    address: string|null;
    priceUSD: number;
  }

  export interface TokenInput {
    asset: Asset;
    amount: string;
}
  
  export const mockChains: ChainMetadata[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      assets: [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          isNative: true,
          address: null,
          priceUSD: 2700
        },
      ],
    },
    {
        id: 'ethereum-sepolia',
        name: 'Ethereum Sepolia',
        assets: [
            {
                name: 'Ethereum',
                symbol: 'ETH',
                isNative: true,
                address: null,
                priceUSD: 2700
            },
            {
                name: 'USDC',
                symbol: 'USDC',
                isNative: false,
                address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
                priceUSD: 1.00
            }
        ],
      },
      {
        id: 'ethereum-holesky',
        name: 'Ethereum Holesky',
        assets: [
            {
                name: 'Ethereum',
                symbol: 'ETH',
                isNative: true,
                address: null,
                priceUSD: 2700
            }
        ],
      },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      assets: [
        {
            name: 'Ethereum',
            symbol: 'ETH',
            isNative: true,
            address: null,
            priceUSD: 2700
        },
      ],
    },
    {
        id: 'arbitrum-sepolia',
        name: 'Arbitrum Sepolia',
        assets: [
            {
                name: 'Ethereum',
                symbol: 'ETH',
                isNative: true,
                address: null,
                priceUSD: 2700
            },
        ],
      },
    {
      id: 'base',
      name: 'Base',
      assets: [
        {
            name: 'Ethereum',
            symbol: 'ETH',
            isNative: true,
            address: null,
            priceUSD: 2700
        },
      ],
    },
    {
        id: 'base-sepolia',
        name: 'Base Sepolia',
        assets: [
            {
                name: 'Ethereum',
                symbol: 'ETH',
                isNative: true,
                address: null,
                priceUSD: 2700
            },
            {
                name: 'USDC',
                symbol: 'USDC',
                isNative: false,
                address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
                priceUSD: 1.00
            }
        ],
      },
    {
      id: 'berachain',
      name: 'Berachain',
      assets: [
        {
            name: 'Bera',
            symbol: 'BERA',
            isNative: true,
            address: null,
            priceUSD: 5.55
        },
      ],
    },
    {
        id: 'berachain-testnet',
        name: 'Berachain Testnet',
        assets: [
            {
                name: 'Bera',
                symbol: 'BERA',
                isNative: true,
                address: null,
                priceUSD: 5.55
            },
        ],
      },
  ];


  export interface OpportunityData {
    id: string;
    name: string;
    chain: string;
    inputAssets: Asset[];
    apy: number;
    enabled: boolean;
    type: 'Lending' | 'LP' | 'Staking';
    protocol: string;
    contractAddress: string;
  }
  
  export const mockOpportunities: OpportunityData[] = [
    {
     id: "1",
      name: "ETH Staking",
      chain: "ethereum",
      inputAssets: [{
        name: 'Ethereum',
        symbol: 'ETH',
        isNative: true,
        address: null,
        priceUSD: 2700
      }],
      apy: 4.8,
      enabled: true,
      type: "Staking",
      protocol: "Lido",
      contractAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
    },
  ];
  



