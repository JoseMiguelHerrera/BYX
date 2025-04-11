import { EthereumSignMessageInputType, EthereumSignMessageResponseType, EthereumSignTypedDataInputType, EthereumSignTypedDataResponseType, PrivyClient } from "@privy-io/server-auth";
import { ChainVM, AdaptedWallet, TransactionStepItem, Execute,adaptViemWallet, SignatureStepItem, getClient } from "@reservoir0x/relay-sdk";
import { Address, createPublicClient, http, Quantity,hexToBytes,Hex, toHex } from "viem";
import { getViemChainByChainNumber } from "../chainPicker";
import { arbitrum, mainnet,berachain,base } from "viem/chains";
import { MAINNET_RELAY_API,createClient, convertViemChainToRelayChain } from '@reservoir0x/relay-sdk'

//Only supports evm chains for now
export class PrivyRelayLinkAdaptor {
    private client: PrivyClient;
    private chainVM: ChainVM;
    private currentChainID: number;
    private currentUserAddress: string;
    constructor(_client: PrivyClient, currentChainID: number, currentUserAddress: string) {
        this.client = _client;
        this.chainVM = "evm";
        this.currentChainID = currentChainID;
        this.currentUserAddress = currentUserAddress;
        console.log("PrivyRelayLinkAdaptor constructor",this.currentUserAddress,this.currentChainID)

        createClient({
          baseApiUrl: MAINNET_RELAY_API,
          chains: [convertViemChainToRelayChain(mainnet),convertViemChainToRelayChain(arbitrum),convertViemChainToRelayChain(berachain),convertViemChainToRelayChain(base)],
        });

    }

    async getPrivyAdaptedWallet(): Promise<AdaptedWallet> {
        return {

            vmType: this.chainVM,
            getChainId: async () => this.currentChainID,
            address: async () => this.currentUserAddress,
            switchChain: async (chainId: number) => {
                this.currentChainID = chainId;
            },
            handleSendTransactionStep: async (chainId: number, item: TransactionStepItem, step: Execute['steps'][0]) => {
                try {
                    const response= await this.client.walletApi.ethereum.sendTransaction({
                        address: this.currentUserAddress,
                        chainType: "ethereum",
                        caip2: `eip155:${this.currentChainID}`,
                        transaction: {
                            data: item.data.data,
                            from: item.data.from,
                            to: item.data.to,
                            chainId: this.currentChainID,
                            value: `0x${BigInt(item.data.value).toString(16)}`,
                            //maxFeePerGas: toHex(item.data.maxFeePerGas as string),
                            //maxPriorityFeePerGas: toHex(item.data.maxPriorityFeePerGas as string),
                        },
                    });
                    console.log("response",response)
                    return response.hash;
                }
                catch (e) {
                  console.log(item)
                  console.log(`handleSendTransactionStep error`,e)
                    console.error(e);
                    return undefined;
                }
            },
            handleConfirmTransactionStep: async (
                txHash,
                chainId,
                onReplaced,
                onCancelled
              ) => {
                const viemChain = getViemChainByChainNumber(this.currentChainID);
                const viemClient = createPublicClient({
                    chain: viemChain,
                    transport: http(), // Use default RPC
                });
                const receipt = await viemClient.waitForTransactionReceipt({
                    hash: txHash as Address,
                    onReplaced: (replacement) => {
                        if (replacement.reason === 'cancelled') {
                          onCancelled()
                          throw Error('Transaction cancelled')
                        }
                        onReplaced(replacement.transaction.hash)
                      }
                })         
                return receipt
              },
              handleSignMessageStep: async (item: SignatureStepItem,step: Execute['steps'][0]) => {
                //await this.client.walletApi.ethereum.signMessage
                //await this.client.walletApi.ethereum.signTypedData
                const signData = item.data?.sign

                if (signData) {
                  // Request user signature
                  if (signData.signatureKind === 'eip191') {
                    //TODO: check the format
                    if (signData.message.match(/0x[0-9a-fA-F]{64}/)) {
                      // If the message represents a hash, we need to convert it to raw bytes first
                      const bytes = hexToBytes(signData.message as Hex);
                        const messageInput:EthereumSignMessageInputType={
                            message: bytes,
                            address: this.currentUserAddress,
                            chainType: "ethereum",
                            idempotencyKey: `sig-${signData.signatureKind}-${Date.now()}-${Buffer.from(signData.message.slice(0, 20)).toString('base64').replace(/[+/=]/g, '')}`// Semi random idempotency key
                        }
                      const sigResponse:EthereumSignMessageResponseType =await this.client.walletApi.ethereum.signMessage(messageInput)
                      return sigResponse.signature
                    } else {
                        const messageInput:EthereumSignMessageInputType={
                            message: signData.message,
                            address: this.currentUserAddress,
                            chainType: "ethereum",
                            idempotencyKey: `sig-${signData.signatureKind}-${Date.now()}-${Buffer.from(signData.message.slice(0, 20)).toString('base64').replace(/[+/=]/g, '')}`// Semi random idempotency key
                        }
                        const sigResponse:EthereumSignMessageResponseType = await this.client.walletApi.ethereum.signMessage(messageInput)
                        return sigResponse.signature
                    }
                  } else if (signData.signatureKind === 'eip712') {

                    console.log("signData",signData)
        
                    const typedData: EthereumSignTypedDataInputType={
                        typedData: {
                            domain: signData.domain, //Record<string, any>
                            types: signData.types, //Record<string, any>
                            message: signData.value, //Record<string, any>
                            primaryType: signData.primaryType //string
                        },
                        address: this.currentUserAddress,
                        chainType: "ethereum"
                    }



                   const sigResponse:EthereumSignTypedDataResponseType = await this.client.walletApi.ethereum.signTypedData(typedData)
                   return sigResponse.signature
                  }
                }


              },
              



            supportsAtomicBatch: async () => false,
        }

    }

    async executeSwap(fromChainId: number, toChainId: number,fromCurrency: string, toCurrency: string, amountWei: string, userAddress: string): Promise<Execute>{
      const adaptedPrivyWallet = await this.getPrivyAdaptedWallet()
      console.log("EXECUTE SWAP")
      console.log("fromChainId",fromChainId)
      console.log("toChainId",toChainId)
      console.log("fromCurrency",fromCurrency)
      console.log("toCurrency",toCurrency)
      console.log("amountWei",amountWei)
      console.log("userAddress",userAddress)
      const quote = await getClient().actions.getQuote({
        chainId: fromChainId,
        toChainId: toChainId,
        currency: fromCurrency,
        toCurrency: toCurrency,
        recipient: userAddress,
        tradeType: "EXACT_OUTPUT",//This will be important to keep an eye on for when we have to link several swaps to keep track of the total amounts.
        amount: amountWei,
        wallet: adaptedPrivyWallet,
      })
      console.log("quote", quote) 
       const result = await getClient().actions.execute({
        quote,
        wallet: adaptedPrivyWallet,
        onProgress: ({ steps, fees, breakdown, currentStep, currentStepItem, txHashes, details }) => {
          //for now were are not going give details to the user, it either works or not
          console.log("relaylink onProgress", { steps, fees, breakdown, currentStep, currentStepItem, txHashes, details })
        },
      })
      return result
    }


}