'use client'
import React from 'react'
import Header from "@/components/Header";
import { cn } from '@/utils/classnames';

function NewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('bg-background text-foreground font-main h-screen w-screen')}>
      <Header />
      <div className={cn('px-4')}>
      {children}
      </div>
      <div id="modal-root" />
    </div>
  );
}

export default NewLayout;