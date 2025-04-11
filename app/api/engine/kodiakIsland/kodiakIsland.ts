import { KodiakIslandRouterABI, KodiakIslandABI } from "../../abis";
import { getViemChainByInternalId } from "../chainPicker";
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
import { TokenInput, OpportunityData, RedeemStatus } from "../../dataModels";
import { genericValidateTokenInputs } from "../validateAssets";
import { createErc20ApprovalTransaction } from "../generic/approveErc20Token";

const SLIPPAGE_PERCENTAGE = 50;//Crazy high, but this is not a real important parameter for LPing

interface MintLPArgs {
    islandContract: Address;
    amount0Desired: bigint;
    amount1Desired: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    minShares: bigint;
    recipient: Address;
}


export async function createKodiakIslandMintTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createKodiakIslandMintTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    await validateKodiakIslandMint(opportunity, tokenInputs, extraData);
    const viemChain = getViemChainByInternalId(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
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

    const poolContractAddress = opportunity.outputAssets[0]?.address;

    if (!poolContractAddress) {
        throw new Error("Invalid contract address");
    }

    const mintLPArgs: MintLPArgs = {
        islandContract: poolContractAddress as Address,
        amount0Desired: token0Desired,
        amount1Desired: token1Desired,
        amount0Min:
            (token0Desired * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100),
        amount1Min:
            (token1Desired * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100),
        minShares: BigInt(0),//TODO: calculate via simulation?
        recipient: userAddress as Address,
    };

    const data = encodeFunctionData({
        abi: KodiakIslandRouterABI,
        functionName: "addLiquidity",
        args: [
            mintLPArgs.islandContract,
            mintLPArgs.amount0Desired,
            mintLPArgs.amount1Desired,
            mintLPArgs.amount0Min,
            mintLPArgs.amount1Min,
            mintLPArgs.minShares,
            mintLPArgs.recipient
        ],
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

export async function createKodiakIslandRedeemTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createKodiakIslandRedeemTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    await validateKodiakIslandRedeem(opportunity, tokenInputs, extraData);
    const viemChain = getViemChainByInternalId(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) +
        nonceOffSet;

    const burnAmount = parseUnits(
        tokenInputs[0]?.amount as string,
        tokenInputs[0]?.asset.decimals as number,
    );

    const totalSupply = await _getKodiakIslandTotalSupply(client, userAddress, opportunity);
    const underlyingBalances = await _getKodiakIslandUnderlyingBalances(client, userAddress, opportunity);

    const expectedAmount0 = underlyingBalances.expectedAmount0! * burnAmount / totalSupply
    const expectedAmount1 = underlyingBalances.expectedAmount1! * burnAmount / totalSupply

    const token0Min=(expectedAmount0 * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100);
    const token1Min=(expectedAmount1 * BigInt(100 - SLIPPAGE_PERCENTAGE)) / BigInt(100);

    const islandPoolContractAddress = opportunity.outputAssets[0]?.address;

    if (!islandPoolContractAddress) {
        throw new Error("Invalid contract address");
    }

    const poolRouterContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!poolRouterContractAddress) {
        throw new Error("Invalid contract address");
    }

    const data = encodeFunctionData({
        abi: KodiakIslandRouterABI,
        functionName: "removeLiquidity",
        args: [
            islandPoolContractAddress,
            burnAmount,
            token0Min,
            token1Min,
            userAddress
        ],
    });

    const transaction = {
        chainId: viemChain.id,
        to: poolRouterContractAddress,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
    };

    return { transaction, wait: client.waitForTransactionReceipt };
}

export async function createKodiakIslandApprovalTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
) {
    const poolRouterContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!poolRouterContractAddress) {
        throw new Error("Invalid contract address");
    }
    return createErc20ApprovalTransaction(
        userAddress,
        opportunity.chain,
        tokenInputs[0]!,
        poolRouterContractAddress as Address,
        nonceOffSet
    )
}

export async function validateKodiakIslandMint(
    opportunity: OpportunityData,
    tokenInputs: TokenInput[],
    extraData: any[] = [],
) {
    console.log("validateKodiakIslandMint")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    //TODO: add kodiak island-specific validation
    await genericValidateTokenInputs(opportunity, tokenInputs, "INVEST");
}

export async function validateKodiakIslandRedeem(
    opportunity: OpportunityData,
    tokenInputs: TokenInput[],
    extraData: any[] = [],
) {
    console.log("validateKodiakIslandRedeem")
    console.log(`extraData: ${JSON.stringify(extraData)}`);

    console.log(`tokenInputs: ${JSON.stringify(tokenInputs)}`);
    if(tokenInputs[0]?.amount === "0") {
        throw new Error("Burn amount is 0");
    }

    //TODO: add kodiak island-specific validation
    await genericValidateTokenInputs(opportunity, tokenInputs, "REDEEM");
}

export async function _getKodiakIslandTotalSupply(client: PublicClient, userAddress: string, opportunity: OpportunityData) {
    const islandContractAddress = opportunity.outputAssets[0]?.address;
    const totalSupplyResponse = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
            abi: KodiakIslandABI,
            functionName: "totalSupply",
            args: [],
        }),
        to: islandContractAddress as Address,
    })

    const totalSupply = decodeFunctionResult({
        abi: KodiakIslandABI,
        functionName: "totalSupply",
        data: totalSupplyResponse.data!,
    }) as bigint;

    return totalSupply;
}

export async function _getKodiakIslandUnderlyingBalances(client: PublicClient, userAddress: string, opportunity: OpportunityData) {
    const islandContractAddress = opportunity.outputAssets[0]?.address;
    const underlyingBalancesResponse = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
            abi: KodiakIslandABI,
            functionName: "getUnderlyingBalances",
            args: [],
        }),
        to: islandContractAddress as Address,
    })

    const underlyingBalances = decodeFunctionResult({
        abi: KodiakIslandABI,
        functionName: "getUnderlyingBalances",
        data: underlyingBalancesResponse.data!,
    }) as bigint[];

    return {
        expectedAmount0: underlyingBalances[0],
        expectedAmount1: underlyingBalances[1],
    };
}



/*

export async function createUniswapMintLPTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenInputs: TokenInput[],
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createUniswapMintLPTransaction")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    await validateMintLP(opportunity, tokenInputs, extraData);
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


    const [tickLower, tickUpper] = priceRangeToTickRange(range.min, range.max, parseInt(fee.toString()), tokenInputs[0]?.asset.decimals as number, tokenInputs[1]?.asset.decimals as number);
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



interface PriceInfo {
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

    return { LpPriceInfo, fee: fee.toString(), sqrtPriceX96: slot0Info[0].toString() };
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

function _getPriceFromSlot0(sqrtPriceX96: bigint, chainId: number, opportunity: OpportunityData): number {

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

async function _getFee(client: PublicClient, contractAddress: Address, userAddress: string) {
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

async function _getPositionInfo(client: PublicClient, contractAddress: Address, userAddress: string, tokenId: bigint) {
    const positionInfoResponse = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
            abi: uniswapV3NonfungiblePositionManager,
            functionName: "positions",
            args: [tokenId],
        }),
        to: contractAddress as Address,
    });
    const positionInfo = decodeFunctionResult({
        abi: uniswapV3NonfungiblePositionManager,
        functionName: "positions",
        data: positionInfoResponse.data!,
    }) as [bigint, Address, Address, Address, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    return positionInfo;
}

export async function getUniswapLPPositions(opportunity: OpportunityData, userAddress: string) {
    const viemChain = getViemChain(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    const investContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!investContractAddress) {
        throw new Error("Invalid contract address");
    }

    const balanceOfResponse = await client.call({
        account: userAddress as Address,
        data: encodeFunctionData({
            abi: uniswapV3NonfungiblePositionManager,
            functionName: "balanceOf",
            args: [userAddress as Address],
        }),
        to: investContractAddress as Address,
    });
    const balance = decodeFunctionResult({
        abi: uniswapV3NonfungiblePositionManager,
        functionName: "balanceOf",
        data: balanceOfResponse.data!,
    }) as number

    if(balance === 0){
        return [];
    }
    const tokenIds = await _allTokenIdsOfOwnerByIndex(opportunity, client, userAddress, balance)

    // Create an array of promises for position data
    const positionPromises = tokenIds.map(tokenId => 
        _getPositionInfo(client, investContractAddress as Address, userAddress, tokenId)
    );
    
    // Wait for all position data to be fetched
    const positions = await Promise.all(positionPromises);
    console.log(`positions: ${positions}`);

    //we can probably do better than this but good for now
    const withdrawalStatuses = positions.map((position, index) => ({
        requestId: tokenIds[index]!.toString(),
        redeemedAsset: opportunity.outputAssets[0]!,
        amountRedeemed: 1,
        redeemRequestTimeStamp: 0,
        claimableTimeStamp: 0,
        redeemable: true,
        redeemed: position[7] === BigInt(0), 
      }));

    return withdrawalStatuses;
}

export async function _allTokenIdsOfOwnerByIndex(opportunity: OpportunityData, client: PublicClient, userAddress: string, numberOfPositions: number) {

    const investContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!investContractAddress) {
        throw new Error("Invalid contract address");
    }

    const callArray=[]
    for(let i = 0; i < numberOfPositions; i++){
        callArray.push(client.call({
            account: userAddress as Address,
            data: encodeFunctionData({
                abi: uniswapV3NonfungiblePositionManager,
                functionName: "tokenOfOwnerByIndex",
                args: [userAddress as Address, BigInt(i)],
            }),
            to: investContractAddress as Address,
        }));
    }

    const tokenOfOwnerByIndexResults = await Promise.all(callArray);
    const decodeArray: bigint[] = [];

    tokenOfOwnerByIndexResults.forEach(result => {
        decodeArray.push(decodeFunctionResult({
            abi: uniswapV3NonfungiblePositionManager,
            functionName: "tokenOfOwnerByIndex",
            data: result.data!,
        }) as bigint);
    });
    return Promise.all(decodeArray);
}

export async function createRedeemTotalUniswapLPTransactions(opportunity: OpportunityData, userAddress: string,nonceOffSet: number = 0, extraData: any[] = []) {
    await validateRedeemTotalUniswapLP(extraData);
    const tokenId = extraData[0] as number;

    const withdrawTx = await createWithdrawTransaction(opportunity, userAddress, tokenId, nonceOffSet);
    const collectRewardsTx = await createCollectRewardsTransaction(opportunity, userAddress, nonceOffSet+1, extraData);

    return [withdrawTx,collectRewardsTx];
}

export async function validateRedeemTotalUniswapLP(
    extraData: any[] = [],
) {
    console.log("validateRedeemTotalUniswapLP")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    //TODO: add uniswap-specific validation
    const tokenId = extraData[0];
    if (!tokenId) {
        throw new Error("tokenId is required");
    }
    //can add more validation here
}

export async function validateUniswapCollectRewards(
    extraData: any[] = [],
) {
    console.log("validateUniswapCollectRewards")
    console.log(`extraData: ${JSON.stringify(extraData)}`);
    //TODO: add uniswap-specific validation
    const tokenId = extraData[0];
    if (!tokenId) {
        throw new Error("tokenId is required");
    }
    //can add more validation here
}

export async function createCollectRewardsTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    nonceOffSet: number = 0,
    extraData: any[] = [],
) {
    console.log("createCollectRewardsTransaction")
    await validateUniswapCollectRewards(extraData);
    const nftId = extraData[0] as number;
    const viemChain = getViemChain(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });

    let nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) 

    console.log(`real time nonce: ${nonce}`)   

    nonce += nonceOffSet
    console.log(`offset nonce ${nonce}`)

    const data = encodeFunctionData({
        abi: uniswapV3NonfungiblePositionManager,
        functionName: "collect",
        args: [{
            tokenId: BigInt(nftId),
            recipient: userAddress as Address,
            amount0Max: 2n ** 127n - 1n, // int128 max value
            amount1Max: 2n ** 127n - 1n, // int128 max value
        }],
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

export async function createWithdrawTransaction(
    opportunity: OpportunityData,
    userAddress: string,
    tokenId: number,
    nonceOffSet: number = 0,
) {
    //TODO: add validation
    const viemChain = getViemChain(opportunity.chain);
    const client = createPublicClient({
        chain: viemChain,
        transport: http(), // Use default RPC
    });
    let nonce =
        (await client.getTransactionCount({ address: userAddress as Address })) 

    console.log(`real time nonce: ${nonce}`)   

    nonce += nonceOffSet
    console.log(`offset nonce ${nonce}`)

    const poolContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "UniswapV3Pool",
    )?.contractAddress;

    if (!poolContractAddress) {
        throw new Error("Invalid contract address");
    }

    const investContractAddress = opportunity.contracts.find(
        (contract) => contract.type === "invest",
    )?.contractAddress;

    if (!investContractAddress) {
        throw new Error("Invalid contract address");
    }

    const positionInfo = await _getPositionInfo(client, investContractAddress as Address, userAddress, BigInt(tokenId));
    const liquidity = positionInfo[7];
    console.log(`liquidity: ${liquidity}`);

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
    const data = encodeFunctionData({
        abi: uniswapV3NonfungiblePositionManager,
        functionName: "decreaseLiquidity",
        args: [[tokenId, liquidity, BigInt(0), BigInt(0), deadline]],//TODO: add slippage protection here. Use simulate client to get the correct amount out
    });

    const transaction = {
        chainId: viemChain.id,
        to: investContractAddress,
        value: `0x${BigInt(0).toString(16)}`,
        nonce,
        data,
    };

    return { transaction, wait: client.waitForTransactionReceipt };
}
*/