import { arbitrum, arbitrumSepolia, base, baseSepolia, berachain, berachainTestnetbArtio, mainnet, sepolia,holesky,Chain } from 'viem/chains'//hard coded for now

export function getViemChain(chainId: string): Chain {
    switch(chainId) {
     case 'arbitrum-sepolia':
         return arbitrumSepolia;
     case 'arbitrum':
         return arbitrum;
     case 'ethereum-sepolia':
         return sepolia;
     case 'ethereum-holesky':
         return holesky;
     case 'ethereum':
         return mainnet;
     case 'base':
         return base;
     case 'base-sepolia':
         return baseSepolia;
     case 'berachain':
         return berachain;
     case 'berachain-testnet':
         return berachainTestnetbArtio;
    }
    throw new Error('Invalid chain');
   };