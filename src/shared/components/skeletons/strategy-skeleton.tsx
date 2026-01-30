import React from "react";

import { Brain } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function StrategyItemSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export function StrategyListSkeleton() {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          Saved Strategy To-Do Lists
        </CardTitle>
        <CardDescription>
          Loading your saved AI-generated To-Do lists...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <StrategyItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  );
}






