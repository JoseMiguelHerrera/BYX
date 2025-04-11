"use client";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import { useLayoutStore } from "@/store/layout";
import useOpportunitiesStore from "@/store/opportunities";
import { cn } from "@/utils/classnames";
import React from "react";
import GridLayout from "react-grid-layout";

const classes = cn("bg-red-500");
function MarketComponents() {
  const { isLoading } = useOpportunitiesStore();
  const activeOpportunity = useActiveOpportunity();

  const layouts = useLayoutStore((state) => state.layouts);

  const layout: GridLayout.Layout[] =
    (activeOpportunity?.id && layouts[activeOpportunity?.id]) ||
    ([] as GridLayout.Layout[]);


  const updateLayout = useLayoutStore((state) => state.updateLayoutById);

  const onLayoutChange = (layouts: GridLayout.Layout[]) => {
    if (isLoading) {
      return;
    }

    activeOpportunity?.id && updateLayout(activeOpportunity?.id, layouts);
  };

  return (
    <GridLayout
      className="layout"
      autoSize
      layout={layout}
      cols={5}
      rowHeight={30}
      width={1200}
      onLayoutChange={onLayoutChange}
    >
      <div key="a" className={classes}>
        a
      </div>
      <div key="b" className={classes}>
        b
      </div>
      <div key="c" className={classes}>
        c
      </div>
    </GridLayout>
  );
}

export default MarketComponents;
