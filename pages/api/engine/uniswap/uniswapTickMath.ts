/**
 * ETH/USDC Tick Calculator for Uniswap V3
 * For pools where ETH is token0 (18 decimals) and USDC is token1 (6 decimals)
 */

/**
 * Tick spacing values for different fee tiers
 */
export const TICK_SPACINGS: Record<number, number> = {
    100: 1,    // 0.01% fee tier
    500: 10,   // 0.05% fee tier
    3000: 60,  // 0.3% fee tier
    10000: 200 // 1% fee tier
  };
  
  /**
   * Convert a price in USDC per ETH to a Uniswap V3 tick
   * For pools where ETH is token0 (18 decimals) and USDC is token1 (6 decimals)
   * 
   * @param priceUsdcPerEth Price in USDC per ETH (e.g., 2000.50)
   * @returns The corresponding Uniswap V3 tick
   */
  export function priceToTick(priceUsdcPerEth: number): number {
    // Convert to Uniswap internal price format
    // For ETH (token0, 18 decimals) and USDC (token1, 6 decimals)
    const adjustedPrice = priceUsdcPerEth * (10 ** (6 - 18)); // = price * 10^-12
    
    // Calculate tick using Uniswap formula
    return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
  }
  
  /**
   * Convert a Uniswap V3 tick to price in USDC per ETH
   * For pools where ETH is token0 (18 decimals) and USDC is token1 (6 decimals)
   * 
   * @param tick The Uniswap V3 tick
   * @returns Price in USDC per ETH
   */
  export function tickToPrice(tick: number): number {
    // Calculate Uniswap internal price
    const internalPrice = Math.pow(1.0001, tick);
    
    // Convert to market price (USDC per ETH)
    return internalPrice * (10 ** (18 - 6)); // = price * 10^12
  }
  
  /**
   * Convert a price range to Uniswap V3 tick range
   * For ETH/USDC pools where ETH is token0 and USDC is token1
   * 
   * @param minPrice Minimum price in USDC per ETH
   * @param maxPrice Maximum price in USDC per ETH
   * @param fee Fee tier in basis points (e.g., 3000 for 0.3%)
   * @returns [lowerTick, upperTick] for the Uniswap V3 position
   */
  export function priceRangeToTickRange(
    minPrice: number,
    maxPrice: number,
    fee: number = 3000
  ): [number, number] {
    // Get tick spacing
    const tickSpacing = TICK_SPACINGS[fee];
    if (!tickSpacing) {
      throw new Error(`Invalid fee tier: ${fee}`);
    }
    
    // Convert prices to ticks
    const minTick = priceToTick(minPrice);
    const maxTick = priceToTick(maxPrice);
    
    // Round to valid tick spacings
    // For lower tick, we want to round down to ensure the tick is <= our price
    const lowerTick = Math.floor(minTick / tickSpacing) * tickSpacing;
    
    // For upper tick, we want to round up to ensure the tick is >= our price
    const upperTick = Math.ceil(maxTick / tickSpacing) * tickSpacing;
    
    return [lowerTick, upperTick];
  }
  
  /**
   * Convert a sqrtPriceX96 value from Uniswap V3 Pool.slot0() to current tick
   * 
   * @param sqrtPriceX96 The sqrtPriceX96 value from Pool.slot0()
   * @returns The current tick
   */
  export function sqrtPriceX96ToTick(sqrtPriceX96: bigint): number {
    // Convert sqrtPriceX96 to a regular number
    const sqrtPrice = Number(sqrtPriceX96) / 2**96;
    
    // Calculate tick using the formula for sqrt prices
    return Math.floor(Math.log(sqrtPrice) / (Math.log(1.0001) / 2));
  }