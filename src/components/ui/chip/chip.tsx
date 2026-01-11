"use client";
import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        selected:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const Chip = ({ className, selected, ref, ...props }: ChipProps) => {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        chipVariants({ variant: selected ? "selected" : "default" }),
        className,
      )}
      ref={ref}
      {...props}
    />
  );
};

Chip.displayName = "Chip";

export { Chip, chipVariants };






