"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export type AppAccessAction = "invest" | "withdraw";
export type AppAccessMode = "grant" | "revoke";

interface AppAccessModalProps {
  isOpen: boolean;
  mode: AppAccessMode;
  action: AppAccessAction;
  isWorking: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

const ACTION_LABEL: Record<AppAccessAction, string> = {
  invest: "invest and divest",
  withdraw: "complete withdrawals",
};

export default function AppAccessModal({
  isOpen,
  mode,
  action,
  isWorking,
  onAllow,
  onDecline,
}: AppAccessModalProps) {
  const isRevoke = mode === "revoke";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={isWorking ? () => {} : onDecline}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {isRevoke
                    ? "Remove BYX\u2019s wallet access?"
                    : "Allow BYX to act on your wallet?"}
                </Dialog.Title>

                {isRevoke ? (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      BYX will no longer be able to {ACTION_LABEL.invest} or{" "}
                      {ACTION_LABEL.withdraw} on your behalf.
                    </p>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      You won&apos;t be locked out. You&apos;ll be asked to approve
                      again before your next withdrawal.
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      To {ACTION_LABEL[action]} on your behalf, BYX needs ongoing
                      permission to act on your wallet.
                    </p>

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                      <p className="mb-2 text-sm font-medium text-amber-800">
                        What you&apos;re granting
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                        <li>
                          BYX can move funds from this wallet without asking each
                          time, including while you&apos;re away from the app.
                        </li>
                        <li>
                          There is currently <strong>no spending limit</strong> on
                          this permission.
                        </li>
                        <li>
                          It also lets BYX complete withdrawals you request.
                        </li>
                        <li>
                          You can remove it at any time with{" "}
                          <strong>Remove Privy Approval</strong> on the
                          Opportunities page.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    disabled={isWorking}
                    className="inline-flex justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    onClick={onDecline}
                  >
                    {isRevoke ? "Keep access" : "Not now"}
                  </button>
                  <button
                    type="button"
                    disabled={isWorking}
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${
                      isRevoke
                        ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                        : "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500"
                    }`}
                    onClick={onAllow}
                  >
                    {isWorking
                      ? "Working\u2026"
                      : isRevoke
                        ? "Remove access"
                        : "Allow access"}
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
