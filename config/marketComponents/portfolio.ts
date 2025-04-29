import { MarketComponent } from "@/types";
import { Breakpoints } from ".";
import { getComponentKey } from "@/containers/MarketComponents";
import ReactGridLayout from "react-grid-layout";

const COMPONENT_KEY = getComponentKey(MarketComponent.Portfolio);
const config: Record<Breakpoints, ReactGridLayout.Layout> = {
  xxs: {
    w: 2,
    h: 4,
    x: 0,
    y: 0,
    i:  COMPONENT_KEY,
    moved: false,
    static: true,
    isDraggable: false,
    isResizable: false,
  },
  xs: {
    w: 3,
    h: 4,
    x: 0,
    y: 0,
    i: COMPONENT_KEY,
    moved: false,
    static: true,
    isDraggable: false,
    isResizable: false,
  },
  sm: {
    w: 4,
    h: 4,
    x: 0,
    y: 0,
    i: COMPONENT_KEY,
    moved: false,
    static: true,
    isDraggable: false,
    isResizable: false,
  },
  md: {
    w: 3,
    h: 4,
    x: 0,
    y: 0,
    i: COMPONENT_KEY,
    moved: false,
    static: true,
    isDraggable: false,
    isResizable: false,
  },
  lg: {
    w: 4,
    h: 4,
    x: 0,
    y: 0,
    i: COMPONENT_KEY,
    moved: false,
    static: true,
    isDraggable: false,
    isResizable: false,
  },
}

export default config;