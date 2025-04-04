import { cn } from '@/utils/classnames';
import React from 'react';

interface HeaderItemProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function HeaderItem({ children, onClick }: HeaderItemProps) {

  return (
    <button onClick={onClick} className={cn('text-foreground-secondary transition-all duration-200 hover:text-foreground cursor-pointer text-base')}>
      {children}
    </button>
  );
}

export default HeaderItem;