"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";
import {mainnet,base,arbitrum,berachain} from 'viem/chains';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

if (!appId) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set");
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          walletList: [
            "detected_wallets",
            "metamask",
            "coinbase_wallet",
            "rainbow",
          ],
        },
        embeddedWallets: {
          createOnLogin: "all-users",
        },
        supportedChains: [mainnet, base, arbitrum, berachain],
      }}
    >
      {children}
      <ToastContainer />
    </PrivyProvider>
  );
}

export default Providers;
