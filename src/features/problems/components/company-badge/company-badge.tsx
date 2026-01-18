import React from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface CompanyBadgeProps {
  companyId: string;
  className?: string;
}

const CompanyBadgeComponent: React.FC<CompanyBadgeProps> = ({ companyId, className }) => {
  return (
    <Link 
        href={`/company/${companyId}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
            "text-xs md:text-sm text-muted-foreground bg-muted px-1.5 rounded-sm border border-border/50 whitespace-nowrap capitalize hover:text-foreground hover:border-border transition-colors",
            className
        )}
    >
        {companyId.replace(/-/g, ' ')}
    </Link>
  );
};

/**
 * A memoized component for displaying a company badge.
 * Optimizes performance by preventing re-renders of the Link and regex operations
 * when the parent component re-renders but the companyId hasn't changed.
 */
const CompanyBadge = React.memo(CompanyBadgeComponent);
export default CompanyBadge;
