"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { env } from "@/env";

interface TypingTestErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function TypingTestErrorFallback({
  error,
  resetErrorBoundary,
}: TypingTestErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-muted/20 rounded-xl border border-dashed border-destructive/50">
      <div className="bg-destructive/10 p-4 rounded-full mb-4 animate-in zoom-in-50 duration-500">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        Typing Game Paused
      </h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Something unexpected happened while loading the game engine. 
        Don&apos;t worry, your stats are safe.
      </p>
      
      <Button 
        onClick={resetErrorBoundary} 
        variant="outline" 
        className="gap-2 hover:bg-destructive/10 hover:text-destructive border-destructive/20"
      >
        <RefreshCw className="h-4 w-4" />
        Restart Game Engine
      </Button>

      {/* Dev only details */}
      {env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-black/5 rounded text-left w-full max-w-lg overflow-auto text-xs font-mono text-muted-foreground">
            <p className="font-bold text-destructive mb-1">Error Details:</p>
            {error.message}
        </div>
      )}
    </div>
  );
}






