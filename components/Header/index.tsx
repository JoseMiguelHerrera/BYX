'use client'

import { cn } from "@/utils/classnames";
import Image from "next/image";
import HeaderItem from "./Item";
import { useRouter } from "next/navigation";
function Header() {
  const router = useRouter();
  return (
    <header className={cn('flex items-center p-4')}>
      <Image src="/svg/L7-logo.svg" alt="logo" width={45} height={40} />
      <div className={cn('flex items-center gap-4 ml-8')}>
        <HeaderItem onClick={() => router.push("/markets")}>Market</HeaderItem>
        <HeaderItem onClick={() => router.push("/margin")}>Margin</HeaderItem>
        <HeaderItem onClick={() => router.push("/profile")}>Profile</HeaderItem>
      </div>
    </header>
  );
}

export default Header;