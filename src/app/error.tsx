/**
 * @fileoverview Defines the global error boundary for the application.
 *
 * This client-side component catches unhandled errors that occur within the application,
 * preventing a full crash and providing a user-friendly fallback UI. It logs the error
 * for debugging purposes and offers the user options to retry the action or navigate
 * to the homepage. This file is part of Next.js's file-based error handling convention.
 */
"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Renders a fallback UI when an unhandled error is caught anywhere in the application.
 *
 * This component is automatically rendered by Next.js in place of the component tree
 * that threw an error. It displays a detailed error card with options to "Try Again",
 * which attempts to re-render the segment, or "Go to Homepage". The error is also
 * logged to the console for development and debugging.
 *
 * @param {{ error: Error & { digest?: string }, reset: () => void }} props - The props provided by Next.js.
 * @param {Error & { digest?: string }} props.error - The error object that was thrown. The `digest` is an automatically generated hash for server-side errors.
 * @param {() => void} props.reset - A function to call to attempt to recover and re-render the component tree.
 * @returns {JSX.Element} The rendered global error page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
      <Card className="w-full max-w-lg shadow-xl border-destructive">
        <CardHeader className="bg-destructive/10">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">
            Oops! Something Went Wrong
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            We encountered an unexpected issue. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Error details (for developers): {error.message}
            {error.digest && (
              <span className="block text-xs mt-1">Digest: {error.digest}</span>
            )}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            variant="destructive"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go to Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}






