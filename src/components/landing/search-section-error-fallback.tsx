"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchSectionErrorFallback() {
  return (
    <section className="py-20 px-8 text-center">
      <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-white/10">
             <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Search Unavailable</h2>
          <p className="text-gray-400 max-w-md">
            We're having trouble loading the search functionality right now.
            You can still browse companies using the menu.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4 border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </div>
    </section>
  );
}
