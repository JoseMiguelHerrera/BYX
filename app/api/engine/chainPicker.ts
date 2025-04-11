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

export function getViemChainByInternalId(chainId: string): Chain {
  switch (chainId) {
    case "arbitrum-sepolia":
      return arbitrumSepolia;
    case "arbitrum":
      return arbitrum;
    case "ethereum-sepolia":
      return sepolia;
    case "ethereum-holesky":
      return holesky;
    case "ethereum":
      return mainnet;
    case "base":
      return base;
    case "base-sepolia":
      return baseSepolia;
    case "berachain":
      return berachain;
    case "berachain-testnet":
      return berachainTestnetbArtio;
  }
  throw new Error("Invalid chain");
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
