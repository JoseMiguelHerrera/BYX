import PriceTicker from "@/components/PriceTicker";
import { cn } from "@/utils/classnames";
import PageTabs from "./components/PageTabs";

function MarketPage() {
  return (
    <div className={cn("flex flex-col")}>
      <div className={cn("px-2")}>
        <PriceTicker />
      </div>
      <PageTabs />
    </div>
  );
}

export default MarketPage;
