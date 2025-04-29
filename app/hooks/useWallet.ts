import { useWallets } from "@privy-io/react-auth";

function useWallet() {
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy",
  );

  return { embeddedWallet };
}

export default useWallet;