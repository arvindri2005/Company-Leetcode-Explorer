"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProblemListErrorFallback() {
  return (
    <Card className="w-full border-destructive/50 bg-destructive/5">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <CardTitle className="text-xl text-destructive">
            Failed to load problems
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We encountered an issue while fetching the problem list. This might be due to a temporary network glitch or service outage.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Page
        </Button>
      </CardFooter>
    </Card>
  );
}
