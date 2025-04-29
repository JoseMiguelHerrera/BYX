import { OpportunityData } from "@/app/api/dataModels";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useOpportunities from "@/app/hooks/useOpportunities";
import useTabs from "@/app/hooks/useTabs";
import Block from "@/components/Block";
import LogoImage from "@/components/LogoImage";
import { cn } from "@/utils/classnames";
import { usdFormatter } from "@/utils/numbers";
import { useRouter } from "next/navigation";
import React from "react";
import { protocolLogos } from "@/config/logos";
import WidgetBlock from "@/components/Block/Widget";

function LiquidityPools() {
  const divRef = React.useRef<HTMLDivElement>(null);

  const activeOpportunity = useActiveOpportunity();
  const { add: addTab, setActive: setActiveTab } = useTabs();

  const router = useRouter();

  const { opportunities } = useOpportunities();

  const poolsForProtocol = activeOpportunity
    ? opportunities.filter((x) => x.protocol === activeOpportunity?.protocol)
    : [];

  const onClickPool = (opportunity: OpportunityData) => {
    addTab(opportunity.id);
    setActiveTab(opportunity.id);
  };

  return (
    <WidgetBlock
      title="Liquidity Pools"
      border
      className={cn("flex flex-col gap-4 w-full h-full relative")}
      ref={divRef}
    >

      <table className={cn("w-full")}>
        <thead
          className={cn(
            "[&_th]:pb-3.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium"
          )}
        >
          <tr>
            <th>Pool</th>
            <th>Base APY</th>
            <th>Rewards APR</th>
            <th>Vol.</th>
            <th>TVL</th>
          </tr>
        </thead>
        <tbody
          className={cn(
            "[&_td]:opacity-60 [&_td]:text-xs [&_td]:font-light [&_td]:pb-2.5"
          )}
        >
          {poolsForProtocol.map((x, index) => {
            return (
              <tr
                key={index}
                className={cn(
                  "hover:[&_td]:opacity-100 transition-all duration-500"
                )}
              >
                <td>
                  <div
                    className={cn(
                      "flex flex-row items-center gap-2 cursor-pointer"
                    )}
                    onClick={() => onClickPool(x)}
                  >
                    <div>
                      {protocolLogos[x.protocol.toLowerCase()] ? (
                        <LogoImage
                          src={`/images/logos/${protocolLogos[x.protocol.toLowerCase()]}`}
                          alt={x.protocol || ""}
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div
                          className={cn("w-6 h-6 bg-gray-200 rounded-full")}
                        />
                      )}
                    </div>
                    <span>
                      {x.inputAssets
                        .map((y) => y.symbol.toUpperCase())
                        .join(",")}
                    </span>
                  </div>
                </td>
                <td>{x.apy}</td>
                <td>--</td>
                <td>423</td>
                <td>{usdFormatter.format(123166523.123)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </WidgetBlock>
  );
}

  export default LiquidityPools;
