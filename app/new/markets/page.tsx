"use client";
import PriceTicker from "@/components/PriceTicker";
import { cn } from "@/utils/classnames";
import PageTabs from "./components/PageTabs";
import MarketHeader from "./components/MarketHeader";
import OrderPanel from "./components/OrderPanel";
import PositionsAndOrders from "./components/PositionsAndOrders";
import MarketComponents from "@/components/containers/MarketComponents";
import useOpportunities from "@/app/hooks/useOpportunities";

function MarketPage() {
  const { opportunities, isLoading, error } = useOpportunities();

  console.log(opportunities, isLoading, error);
  return (
    <div className={cn("flex flex-col")}>
      <div className={cn("px-2")}>
        <PriceTicker />
      </div>
      <PageTabs />
      <MarketHeader />
      <div className={cn("flex flex-col gap-4 mt-4")}>
        <div className={cn("grid grid-cols-[1fr_340px] gap-4")}>
          <div>
            <MarketComponents />
          </div>
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
