export enum Market {
  UNISWAP = "Uniswap",
  CURVE = "Curve",
  THORCHAIN = "Thorchain",
}

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
