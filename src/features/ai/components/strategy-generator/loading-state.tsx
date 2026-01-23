"use client";

import { Loader2 } from "lucide-react";

/**
 * Props for the LoadingState component.
 */
interface LoadingStateProps {
  /** The loading message to display. */
  message: string;
}

/**
 * Renders a loading state with spinner and message.
 *
 * @param {LoadingStateProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered loading state component.
 */
export function LoadingState({ message }: LoadingStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  );
}
