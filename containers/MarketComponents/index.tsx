"use client";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useMarketLayout from "@/app/hooks/useMarketLayout";
import Loader from "@/components/Loader";
import { Breakpoints } from "@/config/marketComponents";
import useOpportunitiesStore from "@/store/opportunities";
import { MarketComponent } from "@/types";
import { cn } from "@/utils/classnames";
import dynamic from "next/dynamic";
import React from "react";
import GridLayout, { Responsive, WidthProvider } from "react-grid-layout";

const classes = cn("bg-red-500");

const ResponsiveGridLayout = WidthProvider(Responsive);

export const getComponentKey = (x: MarketComponent) => `comp_${x}`;

const MarketData = dynamic(
  () => import("@/app/new/markets/components/Elements/MarketData")
);

const Firehose = dynamic(
  () => import("@/app/new/markets/components/Elements/Firehose")
);

const LiquidityPools = dynamic(
  () => import("@/app/new/markets/components/Elements/LiquidityPools")
);

function MarketComponents() {
  const { isLoading } = useOpportunitiesStore();
  const activeOpportunity = useActiveOpportunity();

  const [loading, setLoading] = React.useState(true);

  const {
    layout,
    updateLayout,
    setIsEditing,
    breakpoint,
    setBreakpoint,
  } = useMarketLayout(activeOpportunity);

  React.useEffect(() => {
    if (activeOpportunity?.id) {
      setLoading(true);

      const timeout = Math.floor(Math.random() * 500) + 500;
      setTimeout(() => {
        setLoading(false);
      }, timeout);
    }
  }, [activeOpportunity?.id]);

  // const componentsKeys = layout.map((x) => x.i);
  const componentsKeys = (layout[breakpoint] || []).map((x) => x.i);

  const onLayoutChange = (currentLayout: GridLayout.Layout[], allLayouts: GridLayout.Layouts) => {
    console.log({currentLayout, allLayouts})
    if (isLoading) {
      return;
    }

    activeOpportunity?.id && updateLayout(activeOpportunity?.id, allLayouts);
  };

  if (loading) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center")}>
        <Loader />
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      onBreakpointChange={(breakpoint, cols) => {
        console.log(breakpoint, cols);
        setBreakpoint(breakpoint as Breakpoints);
      }}
      className="layout"
      autoSize
      layouts={layout}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 8, md: 6, sm: 4, xs: 3, xxs: 2 }}
      rowHeight={30}
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag_handler"
      // draggableHandle=".drag_handler"
      useCSSTransforms
      onResizeStart={() => {
        setIsEditing(true);
      }}
      onResizeStop={() => {
        setIsEditing(false);
      }}
      onDragStart={() => {
        setIsEditing(true);
      }}
      onDragStop={() => {
        setIsEditing(false);
      }}
    >
      {componentsKeys.includes(getComponentKey(MarketComponent.MarketData)) && (
        <div
          key={getComponentKey(MarketComponent.MarketData)}
          className={cn("group")}
        >
          <MarketData />
        </div>
      )}

      {componentsKeys.includes(getComponentKey(MarketComponent.Firehose)) && (
        <div
          key={getComponentKey(MarketComponent.Firehose)}
          className={cn("group")}
        >
          <Firehose />
        </div>
      )}

      {componentsKeys.includes(
        getComponentKey(MarketComponent.LiquidityPools)
      ) && (
        <div
          key={getComponentKey(MarketComponent.LiquidityPools)}
          className={cn("group")}
        >
          <LiquidityPools />
        </div>
      )}
    </ResponsiveGridLayout>
  );
}

export default MarketComponents;
