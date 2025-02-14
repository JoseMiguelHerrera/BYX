import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import Funding from "./components/Funding";
import Balances from "./components/Balances";
import Opportunities from "./components/Opportunities";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('dashboard');
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
  } = usePrivy();
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  let smartWallet = null;

  if(user && user.linkedAccounts.length > 1) {
    smartWallet = (user?.linkedAccounts[1] as any).address
  }

  return (
    <>
      <Head>
        <title>BYX: Blockhain Yield Exchange</title>
        <link rel="icon" href="/logos/fractality.svg" type="image/svg+xml" />
      </Head>

      <div className="h-screen flex flex-col">
        <nav className="bg-violet-800 px-4 sm:px-20 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <img src="/logos/fractality.svg" alt="FracFi Logo" className="w-6 h-6" />
              BYX: Blockchain Yield Exchange
            </h1>
            {ready && authenticated && (
              <div className="flex gap-4 items-center">
                <div 
                  className="text-sm bg-violet-200 py-2 px-4 rounded-md text-violet-700 cursor-pointer relative group flex items-center gap-2"
                  title={smartWallet || 'No wallet connected'}
                >
                  Smart Wallet Address: {smartWallet ? `${smartWallet.slice(0, 6)}...${smartWallet.slice(-4)}` : 'No wallet connected'}
                  {smartWallet && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(smartWallet);
                        }}
                        className="hover:text-violet-900"
                        title="Copy address"
                      >
                        📋
                      </button>
                      <div className="absolute hidden group-hover:block bg-gray-900 text-white p-2 rounded-md text-xs whitespace-nowrap -bottom-10 left-1/2 transform -translate-x-1/2">
                        {smartWallet}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <div className="w-64 bg-violet-900 p-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`text-sm ${
                  activeView === 'dashboard' ? 'bg-violet-700' : 'bg-violet-600'
                } hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none`}
              >
                Funding Balances
              </button>
              <button
                onClick={() => setActiveView('funding')}
                className={`text-sm ${
                  activeView === 'funding' ? 'bg-violet-700' : 'bg-violet-600'
                } hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none`}
              >
                Funding
              </button>
              <button
                onClick={() => setActiveView('opportunities')}
                className={`text-sm ${
                  activeView === 'opportunities' ? 'bg-violet-700' : 'bg-violet-600'
                } hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none`}
              >
                Opportunities
              </button>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 px-4 sm:px-20 py-6 sm:py-10 bg-frac-dark-gray overflow-auto">
            {ready && authenticated ? (
              <>
                <div className="mt-12 flex gap-4 flex-wrap">
                  {activeView === 'funding' ? (
                    <Funding smartWalletAddress={smartWallet} />
                  ) : activeView === 'opportunities' ? (
                    <Opportunities smartWalletAddress={smartWallet} />
                  ) : (
                    <Balances smartWalletAddress={smartWallet} />
                  )}
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}
