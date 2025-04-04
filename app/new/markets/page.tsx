import PriceTicker from "@/components/PriceTicker";
import { cn } from "@/utils/classnames";
import PageTabs from "./components/PageTabs";
import MarketHeader from "./components/MarketHeader";
import OrderPanel from "./components/OrderPanel";
import PositionsAndOrders from "./components/PositionsAndOrders";

function MarketPage() {
  return (
    <div className={cn("flex flex-col")}>
      <div className={cn("px-2")}>
        <PriceTicker />
      </div>
      <PageTabs />
      <MarketHeader />
      <div className={cn("flex flex-col gap-4 mt-4")}>
        <div className={cn("grid grid-cols-[1fr_340px] gap-4")}>
          <div>COMPONENTS</div>
          <OrderPanel />
        </div>
        <div>
          <PositionsAndOrders />
        </div>
      </div>
    </div>
  );
}

export default MarketPage;
