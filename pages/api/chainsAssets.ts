import type { NextApiRequest, NextApiResponse } from "next";
import { PrivyClient } from "@privy-io/server-auth";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);


interface Chain {
    id: string;
    name: string;
    assets: Asset[];
  }

  interface Asset {
    name: string;
    symbol: string;
    isNative: boolean;
    address: string|null;
  }
  
  const mockChains: Chain[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      assets: [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          isNative: true,
          address: null,
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
            },
        ],
      },
  ];




export type ChainsAssetsSuccessResponse = {
    chains: Chain[];
};

export type ChainsAssetsErrorResponse = {
    error: string;
};



async function handler(
    req: NextApiRequest,
    res: NextApiResponse<
    ChainsAssetsSuccessResponse | ChainsAssetsErrorResponse
    >,
) {

    const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
    const cookieAuthToken = req.cookies["privy-token"];

    const authToken = cookieAuthToken || headerAuthToken;
    if (!authToken) return res.status(401).json({ error: "Missing auth token" });
    try {
        await client.verifyAuthToken(authToken);
        return res.status(200).json({ chains: mockChains });
    } catch (e: any) {
        console.log(e)
        return res.status(500).json({ error: e.message });
    }

}

export default handler;
