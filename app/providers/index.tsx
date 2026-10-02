"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";
import { mainnet, base, arbitrum, berachain } from "viem/chains";
import OpportunitiesProvider from "./Opportunities";
import { PortfolioAvailabilityProvider } from "./PortfolioAvailability";
import { AppAccessProvider } from "./AppAccess";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

if (!appId) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set");
}

const queryClient = new QueryClient();

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
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        supportedChains: [mainnet, base, arbitrum, berachain],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PortfolioAvailabilityProvider>
          <AppAccessProvider>
            {children}
            <ToastContainer />
            <OpportunitiesProvider />
          </AppAccessProvider>
        </PortfolioAvailabilityProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default Providers;
