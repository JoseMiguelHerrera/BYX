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
import { http } from "viem";

export enum InternalChainId {
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

/**
 * QuickNode Multichain network subdomain for each chain id.
 *
 * Ethereum mainnet is the documented exception: its URL has NO network
 * subdomain (`https://{name}.quiknode.pro/{token}`), so it maps to `null`.
 * Every other chain substitutes `{network}` in `QUICKNODE_MULTICHAIN_URL`.
 * Verified live against the user's endpoint: base-mainnet, arbitrum-mainnet,
 * bera-mainnet (not `berachain-mainnet`).
 */
const QUICKNODE_NETWORK_BY_CHAIN_ID: Record<number, string | null> = {
  1: null, // ethereum mainnet
  11_155_111: "ethereum-sepolia",
  17_000: "holesky",
  8453: "base-mainnet",
  84_532: "base-sepolia",
  42_161: "arbitrum-mainnet",
  421_614: "arbitrum-sepolia",
  80_094: "bera-mainnet",
  80_084: "bera-bepolia",
};

/**
 * Resolve the HTTP RPC URL for a chain from `QUICKNODE_MULTICHAIN_URL`.
 *
 * Returns `undefined` when the env var is unset or the chain is unmapped, so
 * callers can fall back to viem's built-in default safely.
 */
export function resolveRpcUrl(chain: Chain): string | undefined {
  const template = process.env.QUICKNODE_MULTICHAIN_URL;
  if (!template) return undefined;
  const network = QUICKNODE_NETWORK_BY_CHAIN_ID[chain.id];
  if (network === undefined) return undefined;
  if (network === null) {
    // Ethereum mainnet: strip the `.{network}` placeholder entirely.
    return template.replace(".{network}", "").replace("{network}", "");
  }
  return template.replace("{network}", network);
}

/**
 * Viem HTTP transport pointed at QuickNode when configured, else the chain's
 * built-in default. Use this everywhere instead of bare `http()` so a rate-limit
 * or outage on a public RPC (e.g. eth.merkle.io 429) cannot freeze withdrawals.
 */
export function httpFor(chain: Chain) {
  const url = resolveRpcUrl(chain);
  return url ? http(url) : http();
}

export function getViemChainByInternalId(chainId: string): Chain {
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
    default:
      throw new Error("Invalid chain");
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
