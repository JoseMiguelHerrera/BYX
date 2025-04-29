"use client";
import Block from "@/components/Block";
import { cn } from "@/utils/classnames";
import React from "react";
import OrderTypes from "./OrderTypes";
import OrderActions from "./OrderActions";
import TabItem from "@/components/TabItem";
import { getAccessToken } from "@privy-io/react-auth";
import useActiveOpportunity from "@/app/hooks/useActiveOpportunity";
import { toast } from "react-toastify";
import useWallet from "@/app/hooks/useWallet";
import useOrderStore from "./orderStore";
import Loader from "@/components/Loader";
import DepositInputs from "./DepositInputs";
import { OrderAction } from "@/types";
import { AnimatePresence, motion } from "motion/react";
import WithdrawInputs from "./Withdraw";

function OrderPanel() {
  const {
    selectedAction,
    isProcessing,
    setIsProcessing,
    amounts,
    range,
    resetInputs,
  } = useOrderStore();

  const [isHovering, setIsHovering] = React.useState(false);

  const opportunity = useActiveOpportunity();
  const { embeddedWallet } = useWallet();

  const handleWithdrawSubmit = async () => {
    if (!opportunity) { return; }
    if (!embeddedWallet?.address) { return; }

    try {
      setIsProcessing(true);
      const accessToken = await getAccessToken();
      const tokenInputs = opportunity.outputAssets.map((asset) => ({
        asset,
        amount: amounts[asset.symbol] || "0",
      }));
      toast.info("Sending Divestment Request transaction(s)... Please wait.", {
        autoClose: false,
      });
      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: embeddedWallet.address,
          opportunityId: opportunity.id,
          tokenInputs,
          type: "requestDivest",
        }),
      });
      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Divest transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Divest transaction(s) failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Error getting divest transaction(s):", error);
    } finally {
      setIsProcessing(false);
      resetInputs();
    }
  };

  const handleDepositSubmit = async () => {
    if (!opportunity?.id) {
      return;
    }
    if (!embeddedWallet?.address) {
      return;
    }

    setIsProcessing(true);

    console.log("amounts");
    console.log(amounts);
    console.log("range");
    console.log(range);

    try {
      const accessToken = await getAccessToken();
      const tokenInputs = opportunity.inputAssets.map((asset) => ({
        asset,
        amount: amounts[asset.symbol] || "0",
      }));
      toast.info("Sending Investment transaction(s)... Please wait.", {
        autoClose: false,
      });

      const response = await fetch("/api/getTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined),
        },
        body: JSON.stringify({
          smartWalletAddress: embeddedWallet.address,
          opportunityId: opportunity.id,
          tokenInputs,
          type: "invest",
          extraData: [range],
        }),
      });

      if (!response.ok) {
        toast.error(`Failed to get transaction`);
      }

      const res = await response.json();

      if (res.transaction) {
        const txHash = res.transaction;
        toast.success(`Transaction(s) submitted: ${txHash}`, {
          closeOnClick: true,
          autoClose: false,
        });
      } else {
        console.error(res.error);
        toast.error(`Transaction(s) failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Error getting transaction:", error);
    } finally {
      setIsProcessing(false);
      resetInputs();
    }
  };

  const ctaText = selectedAction == OrderAction.Deposit ? "Deposit" : "Withdraw";

  return (
    <Block
      border
      padding={false}
      className={cn("flex flex-col relative h-fit")}
    >
      {/* Top header */}
      <div className={cn("w-full grid grid-cols-2")}>
        <TabItem active>Order Ticket</TabItem>
        <TabItem>Manage</TabItem>
      </div>

      {/* Content  */}
      <div
        className={cn("p-4 flex flex-col gap-4")}
      >
        <OrderActions />
        {/* Order Types */}
        <OrderTypes />

        {/* Inputs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAction}
            transition={{
              bounce: 0,
            }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={cn('z-10')}
          >
            {selectedAction === OrderAction.Deposit && <DepositInputs />}
            {selectedAction === OrderAction.Withdraw && <WithdrawInputs />}
          </motion.div>
        </AnimatePresence>

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
            "w-full bg-primary text-white rounded-sm h-[50px] cursor-pointer font-extrabold relative z-10",
            isProcessing && "flex items-center justify-center"
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={selectedAction == OrderAction.Deposit ? handleDepositSubmit : handleWithdrawSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader /> : ctaText}
        </button>

        <div
          className={cn(
            "top-0 absolute left-0 right-0 bottom-0 overflow-hidden"
          )}
        >
          <div className="absolute h-[258px] mask-radial-to-80% left-0 bottom-[16px] bg-[url('/svg/dot-pattern.svg')] bg-repeat bg-bottom w-full" />
          <div
            className={cn(
              "absolute top-0 left-0 right-0 bottom-4 overflow-hidden"
            )}
          >
            <div
              className={cn(
                "absolute h-[500px] translate-y-1/2 bg-radial from-primary/40 to-40%   left-0 bottom-[50px] w-full",
                "transition-all duration-500 ease-out",
                isHovering && "scale-200"
              )}
            />
          </div>
        </div>
      </div>
    </Block>
  );
}

export default OrderPanel;
