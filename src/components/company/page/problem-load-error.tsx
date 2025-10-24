/**
 * @fileoverview A component to display an error message when problems fail to load.
 *
 * This component renders a distinct error card that informs the user that the
 * list of problems for a company could not be fetched. It displays the specific
 * error message and provides a button to refresh the page.
 */
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

/**
 * Props for the ProblemLoadError component.
 */
interface ProblemLoadErrorProps {
  /** The name of the company for which the problems failed to load. */
  companyName: string;
  /** The error message to display. */
  error: string;
}

/**
 * Renders an error message card for when problem data fails to load.
 *
 * This component is used to handle and display errors that occur during the
 * initial server-side fetch of problems for a company page. It provides clear
 * feedback to the user and a simple action to attempt recovery by reloading the page.
 *
 * @param {ProblemLoadErrorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered error card component.
 */
export default function ProblemLoadError({ companyName, error }: ProblemLoadErrorProps) {
  return (
    <Card className="my-4 border-destructive bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center text-lg">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Failed to Load Problems
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-destructive/90 text-sm">
          We encountered an issue trying to load the problems for {companyName}.
          This might be a temporary issue with our services or with accessing the data.
        </p>
        <p className="text-xs text-destructive/70 mt-2">Error details: {error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
          Try Refreshing
        </Button>
      </CardContent>
    </Card>
  );
}
