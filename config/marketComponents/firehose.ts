import { MarketComponent } from "@/types";
import { Breakpoints } from ".";
import { getComponentKey } from "@/containers/MarketComponents";
import ReactGridLayout from "react-grid-layout";

// cols={{ lg: 8, md: 6, sm: 4, xs: 3, xxs: 2 }}

const COMPONENT_KEY = getComponentKey(MarketComponent.Firehose);

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
    w: 3,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  sm: {
    w: 3,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  md: {
    w: 4,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
  lg: {
    w: 3,
    h: 4,
    x: 0,
    y: 0,
    ...defaultProps,
  },
}

export default config;