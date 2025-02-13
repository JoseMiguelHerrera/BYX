import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy, useFundWallet } from "@privy-io/react-auth";
import { arbitrumSepolia} from 'viem/chains'//hard coded for now
import Head from "next/head";

async function verifyToken() {
  const url = "/api/verify";
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
  });

  return await result.json();
}

async function getBalance(address: string) {
  console.log("sending address", address)
  const url = "/api/balances";
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
    body: JSON.stringify({ address: address }),
  });
  return await result.json();
}

export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [balance, setBalance] = useState<string>();
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkWallet,
    unlinkWallet,
  } = usePrivy();
  const {fundWallet} = useFundWallet();
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;
  const wallet = user?.wallet;
  let smartWallet = null;

  if(user && user.linkedAccounts.length > 1) {
    smartWallet = (user?.linkedAccounts[1] as any).address
  }

  const fundWalletConfig = {
    chain: arbitrumSepolia,
    asset: 'native-currency'
  }
  
  useEffect(() => {
    if (smartWallet) {
      console.log(smartWallet)
      getBalance(smartWallet).then((balance) => {
        console.log(balance)
        setBalance(balance.balance)
      });
    }
  }, [smartWallet]);

  return (
    <>
      <Head>
        <title>Jarvis 2.0 Demo WIP</title>
      </Head>
      <div>
      {balance && (
                <p className="text-sm">
                  Wallet Balance: {balance} WEI
                </p>
              )} 
      </div>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Jarvis 2.0 Demo WIP</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              <button
                onClick={() => fundWallet(smartWallet,fundWalletConfig)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Fund Wallet
              </button>

              {wallet ? (
                <button
                  onClick={() => {
                    unlinkWallet(wallet.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink wallet
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect wallet
                </button>
              )}

 

              <button
                onClick={() => verifyToken().then(setVerifyResult)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Verify token on server
              </button>

              {Boolean(verifyResult) && (
                <details className="w-full">
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Server verify result
                  </summary>
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(verifyResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}
      </main>
    </>
  );
}
