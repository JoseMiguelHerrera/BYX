import React from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { cn } from "@/utils/classnames";
import Image from "next/image";
import Block from "../Block";

interface DropdownProps {
  buttonContent: string;
  options: {
    content: React.ReactNode;
    onClick: () => void;
    className?: string;
  }[];
}
function Dropdown({ buttonContent, options }: DropdownProps) {
  return (
    <Menu>
      <MenuButton
        className={cn(
          "bg-primary text-white rounded-sm text-sm font-medium",
          "px-2 py-1.5 group cursor-pointer"
        )}
      >
        <div className={cn("flex-row flex gap-2")}>
          <span>{buttonContent}</span>
          <Image
            src="/svg/dropdown-arrow.svg"
            alt="Dropdown"
            width={16}
            height={16}
            className={cn(
              "group-data-[active]:rotate-180 duration-200 transition-all"
            )}
          />
        </div>
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom"
        className={cn(
          "origin-top-right z-50",
          "text-white transition duration-300 ease-out flex flex-col",
          "[--anchor-gap:calc(var(--spacing)*2)] focus:outline-none data-[closed]:opacity-0"
        )}
      >
        <Block className={cn("flex flex-col gap-3")} border>
          {options.map((opt) => {
            return (
              <MenuItem key={opt.content?.toLocaleString()}>
                <button
                  className={cn(
                    "hover:opacity-50 text-xs duration-200 transition-all cursor-pointer",
                    opt.className
                  )}
                  onClick={opt.onClick}
                >
                  {opt.content}
                </button>
              </MenuItem>
            );
          })}
        </Block>
      </MenuItems>
    </Menu>
  );
}

export default Dropdown;
