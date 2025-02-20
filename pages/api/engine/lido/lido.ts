import { lidoABI } from "../../abis";
import { getViemChain } from "../chainPicker";
import {Address, createPublicClient, http,encodeFunctionData, parseEther} from 'viem';
import { TokenInput } from "../../mockDB";

export async function createLidoSubmitTransaction(lidoContractAddress: string, userAddress: string, tokenInputs: TokenInput[], chainId: string) {
    //token validatin
    if(tokenInputs.length !== 1) {
        throw new Error('Invalid token inputs (length)');
    }
    const tokenInput = tokenInputs[0];
    if(!tokenInput) {
        throw new Error('Invalid token inputs (null)');
    }
    if(!tokenInput.asset.isNative) {
        throw new Error('Invalid token inputs (not native)');
    }

    const viemChain = getViemChain(chainId);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const nonce = await client.getTransactionCount({ address: userAddress as Address });

    const data = encodeFunctionData({
        abi: lidoABI,
        functionName: 'submit',
        args: ['0x0000000000000000000000000000000000000000'], // No referral
      });

      const gasEstimate=await client.estimateGas({
        account: userAddress as Address,
        to: lidoContractAddress as Address,
        value: parseEther(tokenInput.amount),
        data
      })

      const maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas()

      const transaction = {
        chainId: viemChain.id,
        to: lidoContractAddress,
        value: parseEther(tokenInput.amount).toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        gas: gasEstimate.toString(),
        nonce,
        data
      }

      const uiOptions = {
        description: "Submit ETH to lido to get stETH",
        buttonText: "Submit",
      }

      /*

      // Define EIP-712 Domain
    const domain = {
        name: "Lido",
        version: "1",
        chainId: viemChain.id,
        salt: "0",//TODO: what is this?
        verifyingContract: lidoContractAddress,
    };

      // Define EIP-712 Types
      const types = {
        Transaction: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
        EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "salt", type: "string" },
            { name: "verifyingContract", type: "string" },
        ]   
      }

    // Define Message
    const message = {
        to: lidoContractAddress,
        value: parseEther(tokenInput.amount).toString(),
        gas: gasEstimate.toString(),
        nonce,
        data,
    };


    return { domain, types, message };

*/

return {transaction, uiOptions};
}


///add a verifiy function here like so https://viem.sh/docs/utilities/verifyTypedData.html