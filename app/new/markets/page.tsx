import PriceTicker from "@/components/PriceTicker";
import { cn } from "@/utils/classnames";
import PageTabs from "./components/PageTabs";
import MarketHeader from "./components/MarketHeader";

function MarketPage() {
  return (
    <div className={cn("flex flex-col")}>
      <div className={cn("px-2")}>
        <PriceTicker />
      </div>
      <PageTabs />
      <MarketHeader />
    </div>
  );
}

export default MarketPage;
