"use client";
import Block from "@/components/Block";
import { cn } from "@/utils/classnames";
import React from "react";
import { OrderType } from "@/types";
import OrderTypes from "./OrderTypes";
import OrderActions from "./OrderActions";
import Input from "@/components/Input";
import TabItem from "@/components/TabItem";

function OrderPanel() {
  const [selectedOrderType, setSelectedOrderType] = React.useState<OrderType>(
    OrderType.Market
  );
  const [isHovering, setIsHovering] = React.useState(false);
  return (
    <Block border padding={false} className={cn("flex flex-col relative")}>
      {/* Top header */}
      <div className={cn("w-full grid grid-cols-2")}>
        <TabItem active>Order Ticket</TabItem>
        <TabItem>Manage</TabItem>
      </div>

      {/* Content  */}
      <div className={cn("p-4 flex flex-col gap-4")}>
        <OrderActions />
        {/* Order Types */}
        <OrderTypes />

        {/* Inputs */}
        <div className={cn("flex flex-col gap-2")}>
          <span className={cn("text-sm text-foreground-secondary")}>
            Quantity
          </span>
          <Input numeric />
        </div>

        {/* Information */}
        <div
          className={cn(
            "flex flex-col gap-2 text-sm font-light mt-25 relative z-10"
          )}
        >
          <div className={cn("grid grid-cols-[1fr_auto]")}>
            <span className={cn("text-sm text-foreground-secondary")}>Fee</span>
            <span className={cn("text-sm text-right text-foreground")}>
              $0.00 USD
            </span>
          </div>
          <div className={cn("grid grid-cols-[1fr_auto]")}>
            <span className={cn("text-sm text-foreground-secondary")}>
              Total
            </span>
            <span className={cn("text-sm text-right text-foreground")}>
              $0.00 USD
            </span>
          </div>
          <div className={cn("grid grid-cols-[1fr_auto]")}>
            <span className={cn("text-sm text-foreground-secondary")}>
              Available
            </span>
            <span className={cn("text-sm text-right text-foreground")}>
              $120,264,618,03 USD
            </span>
          </div>
        </div>

        <button
          className={cn(
            "w-full bg-primary text-white rounded-sm h-[50px] cursor-pointer font-extrabold relative z-10"
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          BUY
        </button>

        <div
          className={cn(
            "top-0 absolute left-0 right-0 bottom-0 overflow-hidden"
          )}
        >
          <div className="absolute h-[400px] mask-radial-to-80% left-0 -bottom-[150px] bg-[url('/svg/dot-pattern.svg')] bg-repeat bg-bottom w-full" />
          <div
            className={cn(
              "absolute top-0 left-0 right-0 bottom-4 overflow-hidden"
            )}
          >
            <div
              className={cn(
                "absolute h-[500px] translate-y-1/2 bg-radial from-primary/40 to-40%   left-0 bottom-[50px] w-full",
                'transition-all duration-500 ease-out',
                isHovering && 'scale-200',
              )}
            />
          </div>
        </div>
      </div>
    </Block>
  );
}

export default OrderPanel;
