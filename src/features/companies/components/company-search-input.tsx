"use client";

import React, { forwardRef } from "react";

import { useTypingPlaceholder } from "@/features/tools/hooks/use-typing-placeholder";

interface CompanySearchInputProps
  extends React.ComponentPropsWithoutRef<"input"> {
  companies: string[];
}

/**
 * @fileoverview An optimized input component for company search.
 *
 * This component isolates the typing placeholder animation logic.
 * By moving the `useTypingPlaceholder` hook here, we prevent the parent
 * `CompanySearchBar` (and its heavy children like suggestions list)
 * from re-rendering on every tick of the animation.
 */
export const CompanySearchInput = forwardRef<
  HTMLInputElement,
  CompanySearchInputProps
>(({ companies, ...props }, ref) => {
  const placeholder = useTypingPlaceholder(companies);

  return (
    <input
      ref={ref}
      placeholder={`Search for ${placeholder}|`}
      {...props}
    />
  );
});

CompanySearchInput.displayName = "CompanySearchInput";
