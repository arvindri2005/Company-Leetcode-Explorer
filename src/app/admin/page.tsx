
/**
 * @fileoverview Defines the main dashboard page for the admin section.
 *
 * This client-side component serves as the central hub for administrative tasks.
 * It presents a dashboard with cards that link to different management pages
 * (e.g., bulk-adding companies and problems) and includes interactive components
 * for triggering administrative actions, such as recalculating company statistics.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileSpreadsheet, LibraryBig, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { triggerAllCompanyProblemStatsUpdate } from '@/app/actions/admin.actions';
import { useToast } from '@/hooks/use-toast';

/**
 * A client component that provides a button to trigger the recalculation of all company stats.
 *
 * This component manages the state for the update process, including loading indicators
 * and displaying the results (success or failure message) of the operation. It calls the
 * `triggerAllCompanyProblemStatsUpdate` server action and provides user feedback via toasts.
 *
 * @returns {JSX.Element} A card component with a button to trigger the stats update.
 */
function UpdateStatsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[] | undefined>(undefined);
  const { toast } = useToast();

  const handleUpdateStats = async () => {
    setIsLoading(true);
    setResultMessage(null);
    setErrorDetails(undefined);
    toast({ title: 'Processing...', description: 'Updating company problem statistics. This may take a moment.' });

    const result = await triggerAllCompanyProblemStatsUpdate();

    setIsLoading(false);
    setResultMessage(result.message);
    if (result.success) {
      toast({
        title: 'Stats Update Complete',
        description: result.message,
        duration: result.errors && result.errors.length > 0 ? 10000 : 5000, // Longer if errors
      });
      if (result.errors) setErrorDetails(result.errors);
    } else {
      toast({
        title: 'Stats Update Failed',
        description: result.message,
        variant: 'destructive',
        duration: 10000,
      });
      if (result.errors) setErrorDetails(result.errors);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-primary" />
          Update Company Stats
        </CardTitle>
        <CardDescription>
          Recalculate and update problem statistics (difficulty, recency, common tags) for all companies.
          This can be resource-intensive and should be run periodically or after major data changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleUpdateStats} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Stats...
            </>
          ) : (
            'Trigger Stats Update'
          )}
        </Button>
        {resultMessage && (
          <div className={`mt-3 p-3 rounded-md text-sm ${errorDetails ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <p>{resultMessage}</p>
            {errorDetails && errorDetails.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold">Error Details:</h4>
                <ul className="list-disc list-inside text-xs">
                  {errorDetails.slice(0,5).map((err, index) => ( // Show first 5 errors
                    <li key={index}>{err.companyName} (ID: {err.companyId}): {err.error}</li>
                  ))}
                  {errorDetails.length > 5 && <li>...and {errorDetails.length - 5} more errors. Check server logs.</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


/**
 * Renders the main dashboard for the administrative section.
 *
 * This page provides a high-level overview of available administrative tasks,
 * presented as a series of cards. Each card links to a specific admin function,
 * such as bulk data uploading, or contains interactive elements for site management,
 * like the button for updating company stats.
 *
 * @returns {JSX.Element} The rendered admin dashboard page.
 */
export default function AdminDashboardPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Administrative tools for managing companies and problems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LibraryBig className="h-6 w-6 text-primary" />
              Bulk Add Companies
            </CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) or CSV (.csv) file to add multiple companies at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/bulk-add-companies">Manage Company Uploads</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Bulk Add Problems
            </CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) or CSV (.csv) file to add multiple problems associated with companies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/bulk-add-problems">Manage Problem Uploads</Link>
            </Button>
          </CardContent>
        </Card>

        <UpdateStatsButton />

      </div>
    </section>
  );
}

    