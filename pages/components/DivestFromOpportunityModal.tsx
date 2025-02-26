import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { OpportunityData } from '../api/mockDB';

interface DivestFromOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  onDivest: (amounts: Record<string, string>) => void;
  onRequestDivest: (amounts: Record<string, string>) => void;
  pendingDivestments?: Array<{id: string, timestamp: number, amounts: Record<string, string>}>;
  onCompleteDivest?: (divestmentId: string) => void;
}

export default function DivestFromOpportunityModal({
  isOpen,
  onClose,
  opportunity,
  onDivest,
  onRequestDivest,
  pendingDivestments = [],
  onCompleteDivest,
}: DivestFromOpportunityModalProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'complete'>('request');
  
  if (!opportunity) return null;

  const isImmediateWithdrawal = opportunity.immediateWithdrawal !== false;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Divest from {opportunity.name}
                </Dialog.Title>
                
                {!isImmediateWithdrawal && (
                  <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('request')}
                        className={`${
                          activeTab === 'request'
                            ? 'border-violet-500 text-violet-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                      >
                        Request Withdrawal
                      </button>
                      <button
                        onClick={() => setActiveTab('complete')}
                        className={`${
                          activeTab === 'complete'
                            ? 'border-violet-500 text-violet-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                      >
                        Complete Withdrawal
                      </button>
                    </nav>
                  </div>
                )}
                
                <div className="mt-4">
                  {(isImmediateWithdrawal || activeTab === 'request') && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Protocol: {opportunity.protocol}</p>
                        <p className="text-sm text-gray-500">Type: {opportunity.type}</p>
                        <p className="text-sm text-gray-500">Chain: {opportunity.chain}</p>
                        <p className="text-sm text-gray-500">APY: {opportunity.apy.toFixed(2)}%</p>
                        <p className="text-sm text-gray-500">
                          Required Assets: {opportunity.outputAssets.map(asset => asset.symbol).join(', ')}
                        </p>
                        {!isImmediateWithdrawal && (
                          <p className="mt-2 text-sm font-medium text-amber-600">
                            Note: This opportunity requires a two-step withdrawal process.
                          </p>
                        )}
                      </div>
                      {opportunity.outputAssets.map((asset, index) => (
                        <div key={index}>
                          <label htmlFor={`amount-${asset.symbol}`} className="block text-sm font-medium text-gray-700">
                            {asset.name} Amount
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              name={`amount-${asset.symbol}`}
                              id={`amount-${asset.symbol}`}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                              placeholder={`Enter ${asset.symbol} amount`}
                              step="any"
                              min="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isImmediateWithdrawal && activeTab === 'complete' && (
                    <div className="space-y-4">
                      {pendingDivestments.length === 0 ? (
                        <p className="text-sm text-gray-500">No pending withdrawal requests for this opportunity.</p>
                      ) : (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Withdrawal Requests</h4>
                          <div className="space-y-3">
                            {pendingDivestments.map((divestment) => {
                              const requestTime = new Date(divestment.timestamp);
                              return (
                                <div key={divestment.id} className="border rounded-md p-3 bg-gray-50">
                                  <p className="text-sm text-gray-600">Request ID: {divestment.id}</p>
                                  <p className="text-sm text-gray-600">
                                    Requested: {requestTime.toLocaleDateString()} {requestTime.toLocaleTimeString()}
                                  </p>
                                  <div className="mt-1">
                                    <h5 className="text-xs font-medium text-gray-500">Amounts:</h5>
                                    <ul className="text-sm">
                                      {Object.entries(divestment.amounts).map(([symbol, amount]) => (
                                        <li key={symbol}>{symbol}: {amount}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <button
                                    type="button"
                                    className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-3 py-1 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                                    onClick={() => onCompleteDivest && onCompleteDivest(divestment.id)}
                                  >
                                    Complete Withdrawal
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  
                  {(isImmediateWithdrawal || activeTab === 'request') && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        const amounts: Record<string, string> = {};
                        opportunity.outputAssets.forEach(asset => {
                          const input = document.getElementById(`amount-${asset.symbol}`) as HTMLInputElement;
                          amounts[asset.symbol] = input.value;
                        });
                        
                        if (isImmediateWithdrawal) {
                          onDivest(amounts);
                        } else {
                          onRequestDivest(amounts);
                        }
                      }}
                    >
                      {isImmediateWithdrawal ? 'Divest' : 'Request Withdrawal'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
