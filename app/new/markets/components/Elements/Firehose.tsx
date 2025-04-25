import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import useMarketLayout from "@/app/hooks/useMarketLayout";
import WidgetBlock from "@/components/Block/Widget";
import { MarketComponent } from "@/types";
import { cn } from "@/utils/classnames";
import { decimalFormatter } from "@/utils/numbers";
import Image from "next/image";
import React from "react";

const data: {
  ts: string;
  type: "buy" | "sell";
  usd: number;
  eth: number;
  steth: number;
  taker: string;
}[] = [
  {
    ts: "1m",
    type: "sell",
    usd: 1235172.12,
    eth: 62.12,
    steth: 61.7,
    taker: "0x38gh4giuehrgkjdhgjk329g8hg2",
  },
  {
    ts: "1m",
    type: "buy",
    usd: 21381.231,
    eth: 21.74,
    steth: 20.91,
    taker: "0x87yt4793948gh349hgu",
  },
  {
    ts: "1m",
    type: "buy",
    usd: 43983983.23,
    eth: 58.16,
    steth: 56.11,
    taker: "0x84hg93oinrgejkdfjkgdfj",
  },
  {
    ts: "2m",
    type: "sell",
    usd: 2383212.65,
    eth: 45.12,
    steth: 44.61,
    taker: "0x489ghou345goiuhigjrenkgrljk",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 123.32,
    eth: 0.1,
    steth: 0.08,
    taker: "0x3g79ui4teghjkrjfkgdjkhgjkhfdgdf",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "buy",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
  {
    ts: "3m",
    type: "sell",
    usd: 48583.231,
    eth: 10.23,
    steth: 9.98,
    taker: "0x2378gui4griuheghjkdfhkjgdfhkj",
  },
];

const paginationButtonClasses = cn(
  "cursor-pointer disabled:opacity-20 transition-all duration-200"
);
function Firehose() {
  const divRef = React.useRef<HTMLDivElement>(null);

  const [rowsAmount, setRowsAmount] = React.useState(5);
  const [start, setStart] = React.useState(0);

  const activeOpportunity = useActiveOpportunity();
  const { getCurrentConfigForComponent, breakpoint } = useMarketLayout(activeOpportunity);

  const layoutConfig = getCurrentConfigForComponent(MarketComponent.Firehose);

  React.useEffect(() => {
    const divHeight = divRef.current?.clientHeight;

    if (!divHeight) return;

    const tableHeight = divHeight - 32 - 16 - 24 - 30 - 30;

    const visibleRows = Math.floor(tableHeight / 26);

    setRowsAmount(visibleRows);
  }, [layoutConfig, breakpoint]);

  const renderTypeCell = React.useCallback((type: "buy" | "sell") => {
    return (
      <td
        className={cn("capitalize", type === "buy" ? "text-green" : "text-red")}
      >
        {type}
      </td>
    );
  }, []);

  const renderValueCell = React.useCallback(
    (value: number, type: "buy" | "sell") => {
      const formatted = decimalFormatter.format(value);

      const splitted = formatted.split(".");

      return (
        <td className={cn(type === "buy" ? "text-green" : "text-red")}>
          <span className={cn("text-xs")}>{splitted[0]}</span>
          {splitted[1] && (
            <span className={cn("text-[10px]")}>.{splitted[1]}</span>
          )}
        </td>
      );
    },
    []
  );

  const visibleRows = React.useMemo(() => {
    const totalRows = data.length;

    let requestedEnd = start + rowsAmount;

    if (requestedEnd > totalRows) {
      requestedEnd = totalRows;
    }

    return data.slice(start, requestedEnd);
  }, [start, rowsAmount, data]);

  return (
    <WidgetBlock
      title="Firehose"
      ref={divRef}
    >
      {/* Content */}
      <table className={cn("w-full")}>
        <thead
          className={cn(
            "[&_th]:pb-3.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium"
          )}
        >
          <tr>
            <th>Ts</th>
            <th>Type</th>
            <th>USD</th>
            <th>ETH</th>
            <th>stETH</th>
            <th>Taker</th>
          </tr>
        </thead>
        <tbody className={cn("[&_td]:text-xs [&_td]:font-light [&_td]:pb-2.5")}>
          {visibleRows.map((x, index) => {
            return (
              <tr key={index}>
                <td className={cn("text-white/60")}>{x.ts}</td>
                {renderTypeCell(x.type)}
                {renderValueCell(x.usd, x.type)}
                {renderValueCell(x.eth, x.type)}
                {renderValueCell(x.steth, x.type)}
                <td className={cn("text-white/60")}>0x2...Hd</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        className={cn(
          "flex flex-row justify-between absolute bottom-4 right-4 left-4"
        )}
      >
        {/* Prev */}
        <div className={cn("flex flex-row")}>
          {/* Go To Begin */}
          <button
            className={paginationButtonClasses}
            disabled={start === 0}
            onClick={() => {
              setStart(0);
            }}
          >
            <Image
              src="/svg/pagination_end.svg"
              alt="Begin"
              width={18}
              height={18}
              className={cn("rotate-180 cursor-pointer")}
            />
          </button>

          {/* Go To Previous */}
          <button
            className={paginationButtonClasses}
            disabled={start === 0}
            onClick={() => {
              if (start - rowsAmount > 0) {
                setStart(start - rowsAmount);
              } else {
                setStart(0);
              }
            }}
          >
            <Image
              src="/svg/pagination_next.svg"
              alt="Prev"
              width={18}
              height={18}
              className={cn("rotate-180 cursor-pointer")}
            />
          </button>
        </div>

        {/* Next */}
        <div className={cn("flex flex-row")}>
          {/* Go To Next */}
          <button
            className={paginationButtonClasses}
            disabled={data.length < start + rowsAmount}
            onClick={() => {
              if (start + rowsAmount < data.length) {
                setStart(start + rowsAmount);
              }
            }}
          >
            <Image
              src="/svg/pagination_next.svg"
              alt="Next"
              width={18}
              height={18}
            />
          </button>

          {/* Go To End */}
          <button
            className={paginationButtonClasses}
            disabled={data.length < start + rowsAmount}
            onClick={() => {
              const modulo = data.length % rowsAmount;

              setStart(data.length - modulo);
            }}
          >
            <Image
              src="/svg/pagination_end.svg"
              alt="End"
              width={18}
              height={18}
            />
          </button>
        </div>
      </div>
    </WidgetBlock>
  );
}

export default Firehose;
