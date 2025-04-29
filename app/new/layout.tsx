"use client";
import React from "react";
import Header from "@/components/Header";
import { cn } from "@/utils/classnames";
import { useLayoutStore } from "@/store/layout";

function NewLayout({ children }: { children: React.ReactNode }) {
  const isEditingLayout = useLayoutStore((state) => state.isEditing);

  return (
    <div
      className={cn(
        "bg-background text-foreground font-main h-auto min-h-screen w-screen overflow-hidden ",
        isEditingLayout && "select-none"
      )}
    >
      <Header />
      <div className={cn("px-4")}>{children}</div>
      <div id="modal-root" />
    </div>
  );
}

export default NewLayout;
