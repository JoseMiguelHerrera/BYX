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
          priceUSD: 27000
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
                priceUSD: 27000
            },
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
            priceUSD: 27000
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
                priceUSD: 27000
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
            priceUSD: 27000
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
                priceUSD: 27000
            },
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

