/**
 * @fileoverview A component to display when a requested company is not found.
 *
 * This component renders a user-friendly message indicating that the company
 * associated with a given slug could not be located. It provides a clear
 * call-to-action to navigate back to the main companies list.
 */
import { Button } from "@/components/ui/button";
import { Building2, ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * Props for the CompanyNotFound component.
 */
interface CompanyNotFoundProps {
  /** The slug of the company that was not found. */
  companySlug: string;
}

/**
 * Renders a "Company Not Found" message.
 *
 * This component is intended to be used on a dynamic company page when the
 * requested company slug does not correspond to an existing record in the database.
 * It displays an informative message and a button to return to the companies page.
 *
 * @param {CompanyNotFoundProps} props - The props for the component.
 * @returns {JSX.Element} The rendered "not found" state component.
 */
export default function CompanyNotFound({ companySlug }: CompanyNotFoundProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
      <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
      <h1 className="text-xl font-semibold mb-2">Company Not Found</h1>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        The company you're looking for (slug: {companySlug}) doesn't exist or
        may have been removed.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/companies">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Companies
        </Link>
      </Button>
    </div>
  );
}
