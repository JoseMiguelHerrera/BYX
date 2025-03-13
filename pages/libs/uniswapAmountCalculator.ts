// Fixed Uniswap V3 Token Amount Calculator

/**
 * Calculate token1 amount from token0 amount
 * @param token0Amount - Amount of token0 the user wants to provide
 * @param lowerRange - Lower price bound (token 0 in terms of token 1)
 * @param upperRange - Upper price bound (token 0 in terms of token 1)
 * @param sqrtPriceX96 - Current sqrtPriceX96 from the pool
 * @param currentPrice - Current token0/token1 price (derived from sqrtPriceX96)
 * @returns Required token1 amount, or null if not possible
 */
export function getToken1AmountFromToken0Amount(
  token0Amount: number,
  lowerRange: number,
  upperRange: number,
  currentPrice: number
): number | null {
  if (!token0Amount || token0Amount <= 0) return 0;
  
  // Get square root of prices directly
  const sqrtLower = Math.sqrt(lowerRange);
  const sqrtUpper = Math.sqrt(upperRange);
  const sqrtCurrent = Math.sqrt(currentPrice);
  
  let liquidity: number;
  let token1Amount = 0;
  
  // Check where the current price is relative to the range
  if (currentPrice <= lowerRange) {
    // All liquidity is in ETH (token0)
    liquidity = token0Amount * sqrtLower * sqrtUpper / (sqrtUpper - sqrtLower);
    token1Amount = 0;
  } 
  else if (currentPrice >= upperRange) {
    // All liquidity is in USDC (token1)
    // In this case user can't provide only ETH
    return null;
  }
  else {
    // Price is within range, calculate liquidity from ETH contribution
    liquidity = token0Amount * sqrtCurrent * sqrtUpper / (sqrtUpper - sqrtCurrent);
    
    // Calculate USDC amount from this liquidity
    token1Amount = liquidity * (sqrtCurrent - sqrtLower);
  }
  
  return token1Amount;
}

/**
 * Calculate token0 amount from token1 amount
 * @param token1Amount - Amount of token1 the user wants to provide
 * @param lowerRange - Lower price bound (token 0 in terms of token 1)
 * @param upperRange - Upper price bound (token 0 in terms of token 1)
 * @param sqrtPriceX96 - Current sqrtPriceX96 from the pool
 * @param currentPrice - Current token0/token1 price (derived from sqrtPriceX96)
 * @returns Required token0 amount, or null if not possible
 */
export function getToken0AmountFromToken1Amount(
  token1Amount: number,
  lowerRange: number,
  upperRange: number,
  currentPrice: number
): number | null {
  if (!token1Amount || token1Amount <= 0) return 0;
  
  // Get square root of prices directly
  const sqrtLower = Math.sqrt(lowerRange);
  const sqrtUpper = Math.sqrt(upperRange);
  const sqrtCurrent = Math.sqrt(currentPrice);
  
  let liquidity: number;
  let token0Amount = 0;
  
  // Check where the current price is relative to the range
  if (currentPrice >= upperRange) {
    // All liquidity is in USDC (token1)
    liquidity = token1Amount / (sqrtUpper - sqrtLower);
    token0Amount = 0;
  }
  else if (currentPrice <= lowerRange) {
    // All liquidity is in ETH (token0)
    // In this case user can't provide only USDC
    return null;
  }
  else {
    // Price is within range, calculate liquidity from USDC contribution
    liquidity = token1Amount / (sqrtCurrent - sqrtLower);
    
    // Calculate ETH amount from this liquidity
    token0Amount = liquidity * (sqrtUpper - sqrtCurrent) / (sqrtCurrent * sqrtUpper);
  }
  
  return token0Amount;
}