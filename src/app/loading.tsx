/**
 * @fileoverview Defines the default loading UI for the application.
 *
 * This component provides a fallback loading state that is automatically displayed
 * by Next.js's Suspense mechanism when a page or its data is being loaded. It
 * renders a simple, centered spinner and a "Loading..." message. This file is
 * part of the Next.js App Router's file-based UI conventions.
 */
import { Loader2 } from "lucide-react";

/**
 * Renders the global loading indicator.
 *
 * This component is shown during route transitions and data fetching, providing
 * immediate visual feedback to the user that content is on its way. It features
 * a spinning loader icon and accompanying text.
 *
 * @returns {JSX.Element} The rendered loading state component.
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Loading page...</p>
    </div>
  );
}






