import { getAllUserTokenMovements, getChainById, getOpportunities } from "@/database/queries";
import { getUserTokenList } from "@/libs/debank";
import { UserPosition } from "../dataModels";

export async function getUserPosition(userAddress: string) {

    const opportunities = await getOpportunities();
    const outputAssets: { address: string; debankChainId: string }[] = [];
    for (const opportunity of opportunities) {
        for (const outputAsset of opportunity.outputAssets) {
            if (outputAsset.type === "ERC20") { // Not NFT positions for now.
                const chainMetadata = await getChainById(opportunity.chain);
                outputAssets.push({ address: outputAsset.address as string, debankChainId: chainMetadata?.debankName as string });
            }
        }
    }
    const chains = outputAssets.reduce((acc, asset) => {
        if (asset.debankChainId && !acc.includes(asset.debankChainId)) {
            acc.push(asset.debankChainId);
        }
        return acc;
    }, [] as string[]);

    const getUserTokenListPromises = [];
    for (const chain of chains) {
        getUserTokenListPromises.push(getUserTokenList(userAddress, chain));
    }

    const userTokenListRaw = await Promise.all(getUserTokenListPromises);
    const userTokenList = userTokenListRaw.flat().filter((tokenPosition)=>{
        return tokenPosition.amount > 0 && tokenPosition.price > 0 && outputAssets.some((asset)=>asset.address.toLowerCase() === tokenPosition.id.toLowerCase());
    })
    const userPositions: UserPosition[] = [];
    for (const tokenPosition of userTokenList) {
        userPositions.push({
            name: tokenPosition.name,
            address: tokenPosition.id,
            chain: tokenPosition.chain,
            amount: tokenPosition.amount,
            usdValue: tokenPosition.amount * tokenPosition.price,
            pnlUsd: 0,
            pnlPercent: 0,
        });
    }
    await calculatePnl(userAddress,userPositions);
    return userPositions;
}

// Calculates PnL and updates the userPositions array
// PnL USD = CurrentUSD position value - (SUM(all usd in) - SUM(all usd out))
// PnL Percent = (PnL USD / SUM(all usd in)) * 100
async function calculatePnl(userAddress: string, userPositions: UserPosition[]): Promise<UserPosition[]> {
    const userTokenMovements = await getAllUserTokenMovements(userAddress);

    // Extract the token addresses from userPositions for filtering movements
    const userPositionAddresses = new Set(userPositions.map(p => p.address?.toLowerCase()).filter(addr => !!addr)); // Use addresses from positions

    // Filter the movements to only include those for tokens the user currently holds (based on userPositions)
    const filteredMovements = userTokenMovements.filter(movement =>
        movement.assetAddress && userPositionAddresses.has(movement.assetAddress.toLowerCase())
    );

    // --- PnL Calculation Logic ---

    // 1. Aggregate movements per asset
    const movementsByAsset = new Map<string, { sumUsdIn: number; sumUsdOut: number }>();

    for (const movement of filteredMovements) {
        // Ensure essential movement data exists
        if (!movement.assetAddress || movement.movementAmountUSD == null || !movement.movementDirection) {
            console.warn("Skipping movement due to missing data:", movement);
            continue;
        }

        const addressLower = movement.assetAddress.toLowerCase();
        const amountUsd = parseFloat(movement.movementAmountUSD); // Ensure it's a number

        if (isNaN(amountUsd)) {
           console.warn("Skipping movement due to invalid USD amount:", movement);
           continue;
        }

        const currentSums = movementsByAsset.get(addressLower) || { sumUsdIn: 0, sumUsdOut: 0 };

        if (movement.movementDirection === 'in') {
            currentSums.sumUsdIn += amountUsd;
        } else if (movement.movementDirection === 'out') {
            currentSums.sumUsdOut += amountUsd;
        }
        movementsByAsset.set(addressLower, currentSums);
    }

    // 2. Iterate through userPositions and calculate PnL
    for (const position of userPositions) {
        // Ensure position has a valid address and usdValue
        if (!position.address || typeof position.usdValue !== 'number') {//This check is redundant.
            console.warn("Skipping PnL calculation for position due to missing address or usdValue:", position);
            // Ensure PnL values are set to 0 if skipped
            position.pnlUsd = undefined;
            position.pnlPercent = undefined;
            continue;
        }
        const addressLower = position.address.toLowerCase();
        const movementSums = movementsByAsset.get(addressLower);
        const currentUsdValue = position.usdValue;

        if (movementSums) {
            const { sumUsdIn, sumUsdOut } = movementSums;

            // Calculate PnL USD
            // PnL USD = CurrentUSD position value - (SUM(all usd in) - SUM(all usd out))
            const pnlUsd = currentUsdValue - (sumUsdIn - sumUsdOut);
            position.pnlUsd = pnlUsd;

            // Calculate PnL Percent
            // PnL Percent = (PnL USD / SUM(all usd in)) * 100
            if (sumUsdIn > 0) {
                position.pnlPercent = (pnlUsd / sumUsdIn) * 100;
            } else {
                console.warn("Skipping PnL calculation for position due to division by zero:", position);
                // Handle division by zero: If cost basis (sumUsdIn) is 0
                // Defaulting to 0. Can be adjusted if infinite gain needs specific handling.
                position.pnlPercent = undefined;
            }

             // Handle potential NaN/Infinity display if needed before rounding
             if (position.pnlPercent && !isFinite(position.pnlPercent)) {
                console.warn("Skipping PnL calculation for position due to NaN/Infinity:", position);
                 position.pnlPercent = undefined; // Fallback for safety, adjust if specific large value is needed
             }

        } else {
            console.warn("Skipping PnL calculation for position due to no movements:", position);
            // If there are no historical movements found for this asset address
             position.pnlUsd = undefined; // PnL requires historical data
             position.pnlPercent = undefined;
        }

    }

    // console.log("Positions with PnL:", userPositions); // Optional: Keep for debugging if needed
    return userPositions; // Return the updated array
}