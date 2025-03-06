import { uniswapV3NonfungiblePositionManager,UniswapV3Pool } from "../../abis";
import { getViemChain } from "../chainPicker";
import {
  Address,
  createPublicClient,
  http,
  encodeFunctionData,
  formatEther,
  parseEther,
  parseUnits,
  decodeFunctionResult,
  PublicClient,
} from "viem";
import { TokenInput, OpportunityData, RedeemStatus } from "../../mockDB";
import { genericValidateTokenInputs } from "../validateAssets";
import { createErc20ApprovalTransaction } from "../generic/approveErc20Token";
import { Price, Token, } from "@uniswap/sdk-core";
import { priceRangeToTickRange } from "./uniswapTickMath";

const SLIPPAGE_PERCENTAGE = 50;//Crazy high, but this is not a real important parameter for LPing

interface MintLPArgs {
  token0: Address;
  token1: Address;
  fee: bigint;
  tickLower: bigint;
  tickUpper: bigint;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: Address;
  deadline: bigint;
}

export async function createUniswapMintLPTransaction(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
  extraData: any[] = [],
) {
    console.log("createUniswapMintLPTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
  await validateMintLP(opportunity, tokenInputs,extraData);
  const viemChain = getViemChain(opportunity.chain);
  const client = createPublicClient({
    chain: viemChain,
    transport: http(), // Use default RPC
  });
  const range = extraData[0];
  const nonce =
    (await client.getTransactionCount({ address: userAddress as Address })) +
    nonceOffSet;

  const token0Desired = parseUnits(
    tokenInputs[0]?.amount as string,
    tokenInputs[0]?.asset.decimals as number,
  );
  const token1Desired = parseUnits(
    tokenInputs[1]?.amount as string,
    tokenInputs[1]?.asset.decimals as number,
  );

  const poolContractAddress = opportunity.contracts.find(
    (contract) => contract.type === "UniswapV3Pool",
  )?.contractAddress;

  if (!poolContractAddress) {
    throw new Error("Invalid contract address");
  }

  const fee = await _getFee(client, poolContractAddress as Address, userAddress);
  const slot0Info = await _getSlot0Info(client, poolContractAddress as Address, userAddress);
  console.log(`slot0Info tick: ${slot0Info[1]}`);
  console.log(`fee: ${fee}`);


  const [tickLower, tickUpper] = priceRangeToTickRange(range.min, range.max, parseInt(fee.toString()));
  console.log(`calculatedtickLower: ${tickLower}`);
  console.log(`tickUpper: ${tickUpper}`);

  const mintLPArgs: MintLPArgs = {
    token0: tokenInputs[0]?.asset.address as Address,
    token1: tokenInputs[1]?.asset.address as Address,
    fee: fee,
    tickLower: BigInt(tickLower),
    tickUpper: BigInt(tickUpper),
    amount0Desired: token0Desired,
    amount1Desired: token1Desired,
    amount0Min:
      (token0Desired * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100),
    amount1Min:
      (token1Desired * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100),
    recipient: userAddress as Address,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 1800),
  };
  console.log("token0:", mintLPArgs.token0);
  console.log("token1:", mintLPArgs.token1);
  console.log("fee:", mintLPArgs.fee);
  console.log("tickLower:", mintLPArgs.tickLower);
  console.log("tickUpper:", mintLPArgs.tickUpper);
  console.log("amount0Desired:", mintLPArgs.amount0Desired);
  console.log("amount1Desired:", mintLPArgs.amount1Desired);
  console.log("amount0Min:", mintLPArgs.amount0Min);
  console.log("amount1Min:", mintLPArgs.amount1Min);
  console.log("recipient:", mintLPArgs.recipient);
  console.log("deadline:", mintLPArgs.deadline);

  const data = encodeFunctionData({
    abi: uniswapV3NonfungiblePositionManager,
    functionName: "mint",
    args: [mintLPArgs],
  });

  const investContractAddress = opportunity.contracts.find(
    (contract) => contract.type === "invest",
  )?.contractAddress;

  if (!investContractAddress) {
    throw new Error("Invalid contract address");
  }

  const transaction = {
    chainId: viemChain.id,
    to: investContractAddress,
    value: `0x${BigInt(0).toString(16)}`,
    nonce,
    data,
  };

  return { transaction, wait: client.waitForTransactionReceipt };
}

export async function createUniswapInvestApprovalTransactions(
  opportunity: OpportunityData,
  userAddress: string,
  tokenInputs: TokenInput[],
  nonceOffSet: number = 0,
) {
  let txs = [];
  await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
  console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);

  const contractAddress = opportunity.contracts.find(
    (contract) => contract.type === "invest",
  )?.contractAddress;

  if (!contractAddress) {
    throw new Error("Invalid contract address");
  }

  let nonceOffSetPerTx = nonceOffSet;
  for (const tokenInput of tokenInputs) {
    const inputAssetAddress = tokenInput.asset.address;

    if (!inputAssetAddress) {
      throw new Error("Invalid input asset address");
    }

    const erc20ApprovalTx = await createErc20ApprovalTransaction(
      userAddress,
      opportunity.chain,
      tokenInput,
      contractAddress as Address,
      nonceOffSetPerTx,
    );
    txs.push(erc20ApprovalTx);
    nonceOffSetPerTx++;
  }

  return txs;
}

export async function validateMintLP(
  opportunity: OpportunityData,
  tokenInputs: TokenInput[],
  extraData: any[] = [],
) {
    console.log("validateMintLP")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
  //TODO: add uniswap-specific validation
    const range = extraData[0];
    if(!range) {
      throw new Error("Range is required");
    }

    if(range.min < 0) {
      throw new Error("Range is invalid");
    }

    if(range.min > range.max) {
      throw new Error("Range is invalid");
    }
    //can add more validation here
  //I need to get the current price of the pool via .slot0 of the pool contract to determine if the token ratio is correct
  await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
}

/*
interface Slot0Info {
  sqrtPriceX96: bigint;
  tick: bigint;
  observationIndex: bigint;
  observationCardinality: bigint;
  observationCardinalityNext: bigint;
  feeProtocol: bigint;
  unlocked: boolean;
}
*/

interface PriceInfo{
    priceOf: string;//WETH
    priceIn: string;//USDC
    price: string;
}
export async function getUniswapLPInfo(opportunity: OpportunityData, userAddress: string) {
 
    const viemChain = getViemChain(opportunity.chain);
    const client = createPublicClient({
      chain: viemChain,
      transport: http(),
    });


    const contractAddress = opportunity.contracts.find(
        (contract) => contract.type === "UniswapV3Pool",
      )?.contractAddress;

      if (!contractAddress) {
        throw new Error("Invalid contract address");
      }
      const slot0Info = await _getSlot0Info(client, contractAddress as Address, userAddress);
      const fee = await _getFee(client, contractAddress as Address, userAddress);
      
      const price = _getPriceFromSlot0(slot0Info[0], viemChain.id, opportunity);
      console.log(`price: ${price}`);
      console.log(`fee: ${fee}`);

      const LpPriceInfo: PriceInfo = {
        priceOf: opportunity.inputAssets[0]?.symbol!,
        priceIn: opportunity.inputAssets[1]?.symbol!,
        price: price.toString(),
      };

      return {LpPriceInfo, fee: fee.toString(), sqrtPriceX96: slot0Info[0].toString()};
}



export async function _getSlot0Info(client: PublicClient, contractAddress: Address, userAddress: string) {
    const getSlot0Response = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
          abi: UniswapV3Pool,
          functionName: "slot0",
          args: [],
        }),
        to: contractAddress as Address,
      });
      const slo0Info = decodeFunctionResult({
        abi: UniswapV3Pool,
        functionName: "slot0",
        data: getSlot0Response.data!,
      }) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean]
      return slo0Info;
}

function _getPriceFromSlot0(sqrtPriceX96: bigint,chainId: number, opportunity: OpportunityData): number {

    const token0 = new Token(
        chainId, 
        opportunity.inputAssets[0]?.address as Address, 
        opportunity.inputAssets[0]?.decimals as number, 
        opportunity.inputAssets[0]?.symbol, 
        opportunity.inputAssets[0]?.name
      );
      
      const token1 = new Token(
        chainId, 
        opportunity.inputAssets[1]?.address as Address, 
        opportunity.inputAssets[1]?.decimals as number, 
        opportunity.inputAssets[1]?.symbol, 
        opportunity.inputAssets[1]?.name
      );


    const Q192 = 2n ** 192n; // 2^192 (use native BigInt for exponentiation)
    // Calculate price using native BigInt
    const price = new Price(token0, token1, Q192.toString(), (sqrtPriceX96 * sqrtPriceX96).toString());
    return parseFloat(price.toSignificant(6)); // Convert to a human-readable float
}

async function _getFee(client: PublicClient, contractAddress: Address, userAddress: string){
    const feeResponse = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
          abi: UniswapV3Pool,
          functionName: "fee",
          args: [],
        }),
        to: contractAddress as Address,
      });
      const feeData = decodeFunctionResult({
        abi: UniswapV3Pool,
        functionName: "fee",
        data: feeResponse.data!,
      }) as bigint;
      return feeData;
}
