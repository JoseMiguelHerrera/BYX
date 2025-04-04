import { cn } from '@/utils/classnames'
import React from 'react'

function Block({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-off-black rounded-lg p-4", className)}>
      {children}
    </div>
  )
}

export default Block