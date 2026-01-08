import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileTabErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  tabName?: string;
}

export default function ProfileTabErrorFallback({
  error,
  resetErrorBoundary,
  tabName = "content",
}: ProfileTabErrorFallbackProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive text-lg">
          <AlertCircle className="h-5 w-5" />
          Error Loading {tabName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We encountered an error while loading your {tabName.toLowerCase()}. 
          This might be due to a temporary connection issue.
        </p>
        
        {resetErrorBoundary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetErrorBoundary}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
