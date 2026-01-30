"use client";

import React from "react";

import { Rocket } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/**
 * @interface ShineButtonProps
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 * @description Defines the props for the ShineButton component.
 * @property {React.ReactNode} children - The content to be displayed inside the button.
 * @property {React.ElementType} [icon] - An optional icon component to be displayed next to the children. Defaults to FaRocket.
 */
interface ShineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ElementType;
}

/**
 * @function ShineButton
 * @description A stylized button component with a gradient background, hover effects, and an optional icon. It forwards a ref to the underlying button element.
 * @param {ShineButtonProps} props - The props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref to be forwarded to the button element.
 * @returns {JSX.Element} The rendered shine button component.
 */
const ShineButton = React.forwardRef<HTMLButtonElement, ShineButtonProps>(
  ({ children, className, icon: Icon = Rocket, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 border-none rounded-full text-md font-semibold cursor-pointer transition-all duration-300 no-underline inline-flex items-center justify-center gap-2",
          "bg-gradient-to-r from-brand-teal to-brand-purple text-white",
          "hover:transform hover:-translate-y-1 hover:shadow-glow",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal",
          className,
        )}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </button>
    );
  },
);

ShineButton.displayName = "ShineButton";

export default ShineButton;






