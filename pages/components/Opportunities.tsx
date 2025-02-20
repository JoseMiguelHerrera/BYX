import { useState, useEffect } from 'react';
import InvestInOpportunityModal from './InvestInOpportunityModal';
import { getAccessToken } from "@privy-io/react-auth";
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import {useDelegatedActions,useWallets} from '@privy-io/react-auth';

export interface Asset {
    name: string;
    symbol: string;
    isNative: boolean;
    address: string | null;
    priceUSD: number;
}

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

export default function Opportunities({ smartWalletAddress }: { smartWalletAddress: string }) {
    const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { client,getClientForChain, } = useSmartWallets();

    const fetchOpportunities = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const accessToken = await getAccessToken();
            const response = await fetch('/api/opportunities', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
                },
            });

            if (!response.ok) {
                console.log(response);
                throw new Error('Failed to fetch opportunities');
            }
            const data = await response.json();
            setOpportunities(data.opportunities);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            setOpportunities([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const handleInvest = (opportunity: OpportunityData) => {
        setSelectedOpportunity(opportunity);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedOpportunity(null);
    };

    /*
    const eip712Sign = async (domain: any, types: any, message: any) => {
        try {

            const typedData = { primaryType: 'Transaction', domain: domain, types: types, message: message };
            const uiOptions = {
                title: 'Sample title text',
                description: 'Sample description text',
                buttonText: 'Sample button text',
            };
            const { signature } = await signTypedData(typedData, { uiOptions, address: smartWalletAddress });
            console.log("signature", signature);
            return signature;
        } catch (e) {
            console.log(e)
        }
    }
    */

    const handleInvestSubmit = async (amounts: Record<string, string>) => {

        if (!selectedOpportunity) return;

        try {
            const accessToken = await getAccessToken();
            const tokenInputs = selectedOpportunity.inputAssets.map(asset => ({
                asset,
                amount: amounts[asset.symbol] || '0'
            }));

            const response = await fetch('/api/getTransaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
                },
                body: JSON.stringify({
                    smartWalletAddress: smartWalletAddress,
                    opportunityId: selectedOpportunity.id,
                    tokenInputs
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get transaction');
            }

            const res = await response.json();
            //const { domain, types, message } = res.transaction;
            //console.log("deconstructing transaction");
            //console.log(domain, types, message);
            //if (!domain || !types || !message) throw new Error("Invalid transaction data");

            //const smartWallet = wallets.find(wallet => wallet.address === smartWalletAddress);
            //if (!smartWallet) throw new Error("Smart wallet not found");

            //const signature = await eip712Sign(domain, types, message);

            
            console.log(res.transaction.transaction)

            const chainClient=await getClientForChain({id: res.transaction.transaction.chainId})

            const chainClientArbTestnet=await getClientForChain({id: 421_614})






            await chainClient?.sendTransaction({
                account: chainClient.account,
                calls: [{
                    to: res.transaction.transaction.to,
                    value: res.transaction.transaction.value,
                    data: res.transaction.transaction.data,
                },
                {//simple send to myself
                    to: "0x10cB01F132E66d007438DDE1c6983c1b522B4462",
                    value: res.transaction.transaction.value,
                }
            ]
            }, { uiOptions: {
                description: res.transaction.uiOptions.description,
                buttonText: res.transaction.uiOptions.buttonText,
            } })


            await chainClientArbTestnet?.sendTransaction({
                account: chainClientArbTestnet.account,
                calls: [{//simple send to myself
                    to: "0x10cB01F132E66d007438DDE1c6983c1b522B4462",
                    value: BigInt("5000000000000000"),
                }
            ]
            })

        

            //await client?.sendTransaction()
            /*
            await smartWallet.sendTransaction({
                to: message.to,
                value: message.value,
                data: message.data,
                gasLimit: message.gas,
                gasPrice: message.gasPrice,
                nonce: message.nonce,
                chainId: message.chainId,
            });
            */

            /*
      
            const provider = await smartWallet.getEthereumProvider();
            console.log("provider", provider);
            
            //FIx with https://docs.privy.io/guide/swift/embedded/signatures
            let signature = await provider.request(
              {
                  method: "eth_signTypedData_v4",
                  params: [
                      smartWalletAddress, // Signer address must be first!
                      JSON.stringify({ domain, types, message }), // Convert to JSON string
                    ],
              }
          )
          */

            // console.log("Signed EIP-712 Transaction:", signature);


        } catch (error) {
            console.error('Error getting transaction:', error);
        } finally {
            setIsModalOpen(false);
            setSelectedOpportunity(null);
        }
    };

    return (
        <main className="w-full flex items-center justify-center relative">
            <div className="max-w-6xl w-full mx-8 bg-white p-8 rounded-lg shadow-lg space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Investment Opportunities</h1>
                    <button
                        onClick={fetchOpportunities}
                        disabled={isLoading}
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white"
                        title="Refresh opportunities"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                        </svg>
                    </button>
                </div>

                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Opportunity Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Protocol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chain
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Input Asset(s)
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    APY
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {opportunities.map((opportunity, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {opportunity.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {opportunity.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {opportunity.protocol}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {opportunity.chain}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {opportunity.inputAssets.map(asset => asset.symbol).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {opportunity.apy.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button
                                            onClick={() => handleInvest(opportunity)}
                                            disabled={!opportunity.enabled}
                                            className={`py-2 px-4 rounded ${opportunity.enabled
                                                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {opportunity.enabled ? 'Invest' : 'Coming Soon'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <InvestInOpportunityModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                opportunity={selectedOpportunity}
                onInvest={handleInvestSubmit}
            />
        </main>
    );
}
