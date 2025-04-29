import { MarketComponent } from "@/types";
import { Breakpoints } from ".";
import { getComponentKey } from "@/containers/MarketComponents";
import ReactGridLayout from "react-grid-layout";
const COMPONENT_KEY = getComponentKey(MarketComponent.MarketData);

const isDraggable = true
const isResizable = true

const defaultProps = {
  isDraggable,
  isResizable,
  i: COMPONENT_KEY,
  moved: false,
  static: true,
}
const config: Record<Breakpoints, ReactGridLayout.Layout> = {
  xxs: {
    w: 2,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  xs: {
    w: 1,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  sm: {
    w: 2,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  md: {
    w: 2,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  lg: {
    w: 2,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
}

export default config;