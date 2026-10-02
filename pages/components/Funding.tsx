import { useState, useEffect } from "react";
import { Asset, ChainMetadata } from "@/app/api/dataModels";
import CopyButton from "./CopyButton";

export default function Funding({
  smartWalletAddress,
}: {
  smartWalletAddress: string;
}) {
  const [chains, setChains] = useState<ChainMetadata[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainMetadata | null>(
    null,
  );
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await fetch("/api/chainsAssets");
        if (!response.ok) {
          console.error("Failed to fetch chains");
        }
        const data = await response.json();
        setChains(data.chains);
      } catch (error) {
        console.error("Error fetching chains:", error);
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
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
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
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
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
            <div className="mt-8 p-4 bg-gray-50 rounded-lg space-y-1">
              <p>Selected Chain: {selectedChain.name}</p>
              <p>
                Selected Asset: {selectedAsset.name} ({selectedAsset.symbol})
              </p>
              <p>
                Asset Type:{" "}
                {selectedAsset.type === "NATIVE" ? "Native Asset" : "Token"}
              </p>
              {selectedAsset.address && (
                <p>Contract Address: {selectedAsset.address}</p>
              )}
              <p className="pt-3">Send your {selectedAsset.symbol} to:</p>
              <div className="flex items-center gap-2">
                <span className="font-mono break-all">
                  {smartWalletAddress}
                </span>
                {smartWalletAddress && (
                  <CopyButton
                    value={smartWalletAddress}
                    className="hover:text-violet-900 shrink-0"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
