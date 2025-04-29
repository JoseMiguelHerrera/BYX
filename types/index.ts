export enum OrderType {
  Market = 'Market',
  Limit = 'Limit',
  YieldLimit = 'Yield Limit',
  TWAP = 'TWAP',
}

export enum OrderAction {
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
  Harvest = 'Harvest',
}

export enum PositionsTab {
  Balances = 'Balances',
  Positions = 'Positions',
  OpenOrders = 'Open Orders',
  OrderHistory = 'Order History',
  FundingHistory = 'Funding History',
}

export type OpportunityId = string

export enum MarketComponent {
  MarketData = 'MarketData',
  Firehose = 'Firehose',
  Portfolio = 'Portfolio',
  LiquidityPools = 'LiquidityPools',
}

export enum ProtocolLogo {
  Uniswap = 'uniswap.svg',
  Aave = 'aave.svg',
  Kodiak = 'kodiak.svg',
}

export type InvestmentInfo = {
  LpPriceInfo: {
    price: string;
    priceOf: string;
    priceIn: string;
  };
  fee: string;
  sqrtPriceX96: string
};