import { useState, useEffect } from 'react';
import { arbitrumSepolia,arbitrum,sepolia,mainnet,base,baseSepolia,berachain,berachainTestnet} from 'viem/chains'//hard coded for now
import { useFundWallet } from "@privy-io/react-auth";
import { getViemChain } from '../api/engine/chainPicker';

interface Asset {
  name: string;
  symbol: string;
  isNative: boolean;
  address: string|null;
}

interface Chain {
  id: string;
  name: string;
  assets: Asset[];
}

function generateFundingObject(chain: Chain, asset: Asset) {
    console.log(chain,asset);
   let viemChain = getViemChain(chain.id);

   let assetConfig: string | {erc20: string};
   if(asset.isNative) {
    assetConfig = 'native-currency';
   } else {
        if(!asset.address) {
            throw new Error('Asset address missing');
        }
    assetConfig = {erc20: asset.address};
   }

   return {
    chain: viemChain,
    asset: assetConfig
   }
  };

export default function Funding({ smartWalletAddress }: { smartWalletAddress: string }) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const {fundWallet} = useFundWallet();

  function fund() {
    if(!selectedChain || !selectedAsset) {
        return;
    }
    const fundWalletConfig = generateFundingObject(selectedChain, selectedAsset);
    console.log(fundWalletConfig);
    fundWallet(smartWalletAddress, fundWalletConfig);
  }

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await fetch('/api/chainsAssets');
        if (!response.ok) {
          throw new Error('Failed to fetch chains');
        }
        const data = await response.json();
        setChains(data.chains);
      } catch (error) {
        console.error('Error fetching chains:', error);
      }
    };

    fetchChains();
  }, []);

  return (
    <main className="w-full flex items-center justify-center bg-[#1C1C1C]">
      <div className="max-w-2xl w-full mx-8 bg-white p-8 rounded-lg shadow-lg space-y-6">
        <h1 className="text-2xl font-bold">Funding</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Chain</h2>
            <div className="grid grid-cols-2 gap-3">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  className={`p-3 rounded-lg border ${
                    selectedChain?.id === chain.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedChain(chain);
                    setSelectedAsset(null);
                  }}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          {selectedChain && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Select Asset</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedChain.assets.map((asset) => (
                  <button
                    key={asset.address || asset.symbol}
                    className={`p-4 rounded-lg border ${
                      selectedAsset?.symbol === asset.symbol
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {asset.name} ({asset.symbol})
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedChain && selectedAsset && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p>Selected Chain: {selectedChain.name}</p>
              <p>Selected Asset: {selectedAsset.name} ({selectedAsset.symbol})</p>
              <p>Asset Type: {selectedAsset.isNative ? 'Native' : 'Token'}</p>
              {selectedAsset.address && (
                <p>Contract Address: {selectedAsset.address}</p>
              )}
            </div>
          )}
        </div>
        <button
                onClick={() => fund()}
                disabled={!selectedChain || !selectedAsset}
                className={`text-sm py-2 px-4 rounded-md text-white border-none ${
                  selectedChain && selectedAsset 
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Fund Wallet
              </button>
      </div>
    </main>
  );
}
