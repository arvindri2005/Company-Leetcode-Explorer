/**
 * @fileoverview A component to display when a company has no associated problems.
 *
 * This component renders a user-friendly message indicating that there are currently
 * no coding problems listed for a specific company. It provides clear calls-to-action,
 * encouraging users to either browse other companies or contribute by adding a new problem.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronLeft, PlusSquare } from "lucide-react";
import Link from "next/link";

/**
 * Props for the NoProblemsAvailable component.
 */
interface NoProblemsAvailableProps {
  /** The name of the company that has no problems. */
  companyName: string;
  /** The ID of the company, used to pre-fill the "Add Problem" form. */
  companyId: string;
}

/**
 * Renders a message for when no coding problems are available for a company.
 *
 * This component displays an informative message and provides two primary actions:
 * 1. A link to go back to the main companies list.
 * 2. A link to the "Add Problem" page, pre-filled with the current company's
 *    ID and name to streamline the contribution process.
 *
 * @param {NoProblemsAvailableProps} props - The props for the component.
 * @returns {JSX.Element} The rendered "no problems" state component.
 */
export default function NoProblemsAvailable({
  companyName,
  companyId,
}: NoProblemsAvailableProps) {
  return (
    <Card className="text-center py-8 rounded-xl">
      <CardContent>
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-2">
          No Problems Available for {companyName}
        </h2>
        <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
          We don't have coding problems for {companyName} yet. You can help by
          adding some!
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/companies">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Browse Companies
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1">
            <Link
              href={`/submit-problem?companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`}
            >
              <PlusSquare className="h-4 w-4 mr-1" />
              Add Problem
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
