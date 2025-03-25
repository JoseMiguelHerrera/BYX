import { useState, useEffect } from "react";
import { getViemChain } from "../api/engine/chainPicker";
import { toast } from "react-toastify";
import { Asset, ChainMetadata } from "../api/dataModels";

function generateWithdrawalObject(chain: ChainMetadata, asset: Asset, amount: string, recipientAddress: string) {
  return {
    chain: chain,
    asset: asset,
    amount: amount,
    recipientAddress: recipientAddress,
  };
}

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
  const [amount, setAmount] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");

  async function withdraw() {
    if (!selectedChain || !selectedAsset || !amount || !recipientAddress) {
      toast.error("Please fill in all fields");
      return;
    }
    
    toast.info("Processing withdrawal request... Please wait.", {
      autoClose: false,
    });
    
    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          smartWalletAddress,
          chainId: selectedChain.id,
          asset:selectedAsset,
          amount,
          recipientAddress,
          type: "withdraw",
        }),
      });
      
      const data = await response.json();
      
      if (data.transaction) {
        toast.success(`Withdrawal transaction submitted: ${data.transaction}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(data.error);
        toast.error(`Withdrawal failed: ${data.error}`);
      }
    } catch (error:any) {
      console.error("Error processing withdrawal:", error);
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  }

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
        <h1 className="text-2xl font-bold">Withdraw Funding Assets</h1>

        {/* Warning Box */}
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important</h3>
          <ul className="list-disc pl-5 text-yellow-700">
            <li>Make sure that you control the wallet you're withdrawing to</li>
            <li>Check that you have enough assets</li>
          </ul>
        </div>

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
            <>
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
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
              </div>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Withdraw
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="any"
                  />
                </div>
                
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => withdraw()}
          disabled={!selectedChain || !selectedAsset || !amount || !recipientAddress}
          className={`text-sm py-2 px-4 rounded-md text-white border-none ${
            selectedChain && selectedAsset && amount && recipientAddress
              ? "bg-violet-600 hover:bg-violet-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Withdraw
        </button>
      </div>
    </main>
  );
}
