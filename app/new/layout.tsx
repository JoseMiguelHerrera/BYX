'use client'
import React from 'react'
import Header from "@/components/Header";
import { cn } from '@/utils/classnames';

function NewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('bg-background text-foreground font-main h-screen w-screen')}>
      <Header />
      {children}
    </div>
  );
}

export default NewLayout;