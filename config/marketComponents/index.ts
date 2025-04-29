import { MarketComponent } from "@/types";
import marketDataConfig from './marketData'
import firehoseConfig from './firehose'
import liquidityPoolsConfig from './liquidityPools'
import portfolioConfig from './portfolio'
import ReactGridLayout from "react-grid-layout";
export type Breakpoints = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';


const MarketComponentsDefaults: Record<MarketComponent, Record<Breakpoints, ReactGridLayout.Layout>> = {
  [MarketComponent.MarketData]: marketDataConfig,
  [MarketComponent.Firehose]: firehoseConfig,
  [MarketComponent.Portfolio]: portfolioConfig,
  [MarketComponent.LiquidityPools]: liquidityPoolsConfig,
};

export default MarketComponentsDefaults;
