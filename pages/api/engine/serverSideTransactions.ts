import { PrivyClient } from '@privy-io/server-auth';
import dotenv from 'dotenv';
dotenv.config();

export default class ServerSideTransactions {
    private client: PrivyClient;
    constructor() {
        if(!process.env.NEXT_PUBLIC_PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET || !process.env.PRIVY_DELEGATION_KEY) {
            throw new Error('Missing Privy environment variables');
        }
        this.client = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_SECRET, {
            walletApi: {
              authorizationPrivateKey: process.env.PRIVY_DELEGATION_KEY
            }
          });
    }

    async sendTransaction(userAddress: string, transaction: any) {
        const {hash} = await this.client.walletApi.ethereum.sendTransaction({
            address: userAddress,
            chainType: 'ethereum',
            caip2: `eip155:${transaction.chainId}`,
            transaction: transaction
          });

          return hash;
    }
      


}

