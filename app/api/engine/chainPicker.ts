import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  berachain,
  berachainTestnetbArtio,
  mainnet,
  sepolia,
  holesky,
  Chain,
} from "viem/chains"; //hard coded for now


enum InternalChainId {
  ArbitrumSepolia = "arbitrum-sepolia",
  Arbitrum = 'arbitrum',
  EthereumSepolia = 'ethereum-sepolia',
  EthereumHolesky = 'ethereum-holesky',
  Ethereum = 'ethereum',
  Base = 'base',
  BaseSepolia = 'base-sepolia',
  Berachain = 'berachain',
  BerachainTestnet = 'berachain-testnet',
}


export function getViemChainByInternalId(chainId: InternalChainId): Chain {
  switch (chainId) {
    case InternalChainId.ArbitrumSepolia:
      return arbitrumSepolia;
    case InternalChainId.Arbitrum:
      return arbitrum;
    case InternalChainId.EthereumSepolia:
      return sepolia;
    case InternalChainId.EthereumHolesky:
      return holesky;
    case InternalChainId.Ethereum:
      return mainnet;
    case InternalChainId.Base:
      return base;
    case InternalChainId.BaseSepolia:
      return baseSepolia;
    case InternalChainId.Berachain:
      return berachain;
    case InternalChainId.BerachainTestnet:
      return berachainTestnetbArtio;
  }
}

export function getViemChainByChainNumber(chainNumber: number): Chain {
  switch (chainNumber) {
    case 421_614:
      return arbitrumSepolia;
    case 42_161:
      return arbitrum;
    case 11_155_111:
      return sepolia;
    case 17000:
      return holesky;
    case 1:
      return mainnet;
    case 8453:
      return base;
    case 84532:
      return baseSepolia;
    case 80094:
      return berachain;
    case 80084:
      return berachainTestnetbArtio;
  }
  throw new Error("Invalid chain");
}
