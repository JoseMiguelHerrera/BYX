"use client";
import Block from "@/components/Block";
import { cn } from "@/utils/classnames";
import React from "react";
import OrderItem from "./OrderItem";
import { OrderType } from "@/types";
import OrderTypes from "./OrderTypes";
import OrderActions from "./OrderActions";
function OrderPanel() {
  const [selectedOrderType, setSelectedOrderType] = React.useState<OrderType>(
    OrderType.Market
  );

  return (
    <Block border padding={false} className={cn("flex flex-col")}>
      {/* Top header */}
      <div className={cn("w-full grid grid-cols-2")}>
        <OrderItem active>Order Ticket</OrderItem>
        <OrderItem>Manage</OrderItem>
      </div>

      {/* Content  */}
      <div className={cn("p-4 flex flex-col gap-4")}>
        <OrderActions />
        {/* Order Types */}
        <OrderTypes />
      </div>
    </Block>
  );
}

export default OrderPanel;
