/**
 * @fileoverview A component for rendering the header section of a company page.
 *
 * This component displays navigational elements specific to the company page,
 * including breadcrumb links and a "Back to Companies" button.
 */
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * Props for the CompanyPageHeader component.
 */
interface CompanyPageHeaderProps {
  /** The name of the company to display in the breadcrumbs. */
  companyName: string;
}

/**
 * Renders the header for a company detail page.
 *
 * This component provides two key navigational aids:
 * 1. A breadcrumb trail (e.g., Home / Companies / [CompanyName]).
 * 2. A "Back to Companies" link with a chevron icon for easy navigation.
 *
 * @param {CompanyPageHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered page header component.
 */
export default function CompanyPageHeader({
  companyName,
}: CompanyPageHeaderProps) {
  return (
    <div className="mb-4">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href="/companies"
          className="hover:text-foreground transition-colors"
        >
          Companies
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">
          {companyName}
        </span>
      </nav>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/companies">
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back to Companies</span>
        </Link>
      </Button>
    </div>
  );
}
