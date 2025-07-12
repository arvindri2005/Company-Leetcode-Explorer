'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FaRocket } from 'react-icons/fa';

interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ElementType;
}

const ShineButton = React.forwardRef<HTMLButtonElement, ShineButtonProps>(
  ({ children, className, icon: Icon = FaRocket, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 border-none rounded-full text-md font-semibold cursor-pointer transition-all duration-300 no-underline inline-flex items-center justify-center gap-2",
          "bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] text-white",
          "hover:transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,212,170,0.3)]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d4aa]",
          className
        )}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </button>
    );
  }
);

ShineButton.displayName = 'ShineButton';

export default ShineButton;
