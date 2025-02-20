import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { OpportunityData, Asset } from './Opportunities';

interface InvestInOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityData | null;
  onInvest: (amounts: Record<string, string>) => void;
}

export default function InvestInOpportunityModal({
  isOpen,
  onClose,
  opportunity,
  onInvest,
}: InvestInOpportunityModalProps) {
  if (!opportunity) return null;

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
                  Invest in {opportunity.name}
                </Dialog.Title>
                <div className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Protocol: {opportunity.protocol}</p>
                      <p className="text-sm text-gray-500">Type: {opportunity.type}</p>
                      <p className="text-sm text-gray-500">Chain: {opportunity.chain}</p>
                      <p className="text-sm text-gray-500">APY: {opportunity.apy.toFixed(2)}%</p>
                      <p className="text-sm text-gray-500">
                        Required Assets: {opportunity.inputAssets.map(asset => asset.symbol).join(', ')}
                      </p>
                    </div>
                    {opportunity.inputAssets.map((asset, index) => (
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
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    onClick={() => {
                      const amounts: Record<string, string> = {};
                      opportunity.inputAssets.forEach(asset => {
                        const input = document.getElementById(`amount-${asset.symbol}`) as HTMLInputElement;
                        amounts[asset.symbol] = input.value;
                      });
                      onInvest(amounts);
                    }}
                  >
                    Invest
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
