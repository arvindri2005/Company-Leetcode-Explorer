/**
 * @fileoverview Profile tabs navigation component
 */
"use client";

import { Bookmark, Briefcase, CheckCircle2, FolderKanban, ListTodo, Pencil } from "lucide-react";

import { TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export interface ProfileTabsProps {
  bookmarksCount: number;
  solvedCount: number;
  attemptedCount: number;
  todoCount: number;
  strategiesCount: number;
}

/**
 * ProfileTabs component displays tab navigation for different profile sections
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function ProfileTabs({
  bookmarksCount,
  solvedCount,
  attemptedCount,
  todoCount,
  strategiesCount,
}: ProfileTabsProps) {
  return (
    <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 sm:gap-2 mb-6 sm:grid-cols-3 lg:grid-cols-6">
      <TabsTrigger value="bookmarks" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <Bookmark className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">Bookmarks<span className="hidden sm:inline"> ({bookmarksCount})</span></span>
      </TabsTrigger>
      <TabsTrigger value="solved" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <CheckCircle2 className="h-4 w-4 sm:h-4 sm:w-4 text-green-500 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">Solved<span className="hidden sm:inline"> ({solvedCount})</span></span>
      </TabsTrigger>
      <TabsTrigger value="attempted" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <Pencil className="h-4 w-4 sm:h-4 sm:w-4 text-yellow-500 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">Attempted<span className="hidden sm:inline"> ({attemptedCount})</span></span>
      </TabsTrigger>
      <TabsTrigger value="todo" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <ListTodo className="h-4 w-4 sm:h-4 sm:w-4 text-blue-500 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">To-Do<span className="hidden sm:inline"> ({todoCount})</span></span>
      </TabsTrigger>
      <TabsTrigger value="strategyLists" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <FolderKanban className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">Strategies<span className="hidden sm:inline"> ({strategiesCount})</span></span>
      </TabsTrigger>
      <TabsTrigger value="background" className="flex-col sm:flex-row gap-1 sm:gap-2">
        <Briefcase className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs sm:text-sm">Background</span>
      </TabsTrigger>
    </TabsList>
  );
}
