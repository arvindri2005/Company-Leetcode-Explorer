import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Fallback component displayed when a ProblemCard fails to render.
 */
const ProblemCardErrorFallback = () => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20 min-h-[72px]">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">
          Error loading problem
        </span>
      </div>
    </div>
  );
};

export default ProblemCardErrorFallback;






