import { useLayoutStore } from "@/store/layout";
import { OpportunityData } from "../api/dataModels";
import GridLayout from "react-grid-layout";
import { MarketComponent } from "@/types";
import MarketComponentsDefaults from "@/config/marketComponents";
import { getComponentKey } from "@/containers/MarketComponents";

function useMarketLayout(activeOpportunity?: OpportunityData) {
  const stateLayouts = useLayoutStore((state) => state.layouts);
  const updateLayout = useLayoutStore((state) => state.updateLayoutById);
  const { isEditing, setIsEditing } = useLayoutStore();
  const { breakpoint, setBreakpoint } = useLayoutStore();

  const layouts: GridLayout.Layouts =
    (activeOpportunity?.id && stateLayouts[activeOpportunity?.id]) ||
    ({} as GridLayout.Layouts);

  const addComponent = (componentName: MarketComponent) => {
    if (!activeOpportunity?.id) return;

    const config = MarketComponentsDefaults[componentName];

    if (!config) return;

    const newLayouts = {
      xxs: [...(layouts.xxs || []), config.xxs],
      xs: [...(layouts.xs || []), config.xs],
      sm: [...(layouts.sm || []), config.sm],
      md: [...(layouts.md || []), config.md],
      lg: [...(layouts.lg || []), config.lg],
    }

    console.log({ newLayouts })

    updateLayout(activeOpportunity?.id, newLayouts)
  };

  const deleteComponent = (componentName: MarketComponent) => {
    if (!activeOpportunity?.id) return;

    const newLayouts = Object.keys(layouts).reduce((acc, breakpoint) => {
      const breakpointLayout = layouts[breakpoint]

      if (!breakpointLayout) return acc

      return {
        ...acc,
        [breakpoint]: breakpointLayout.filter((x) => x.i !== getComponentKey(componentName))
      }
    }, { } as GridLayout.Layouts)

    updateLayout(activeOpportunity.id, newLayouts);
  };

  const getCurrentConfigForComponent = (componentName: MarketComponent) => {
    return layouts[breakpoint]?.find((x) => x.i === getComponentKey(componentName));
  };

  return {
    updateLayout,
    addComponent,
    deleteComponent,
    layout: layouts,
    getCurrentConfigForComponent,
    setIsEditing,
    isEditing,
    breakpoint,
    setBreakpoint,
  };
}

export default useMarketLayout;
