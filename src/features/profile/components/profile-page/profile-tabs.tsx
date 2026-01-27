/**
 * @fileoverview Profile tabs navigation component
 */
"use client";

import { Bookmark, Briefcase, CheckCircle2, FolderKanban, ListTodo, Pencil } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 mb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <TabsTrigger value="bookmarks">
        <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
        Bookmarks ({bookmarksCount})
      </TabsTrigger>
      <TabsTrigger value="solved">
        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" aria-hidden="true" />
        Solved ({solvedCount})
      </TabsTrigger>
      <TabsTrigger value="attempted">
        <Pencil className="mr-2 h-4 w-4 text-yellow-500" aria-hidden="true" />
        Attempted ({attemptedCount})
      </TabsTrigger>
      <TabsTrigger value="todo">
        <ListTodo className="mr-2 h-4 w-4 text-blue-500" aria-hidden="true" />
        To-Do ({todoCount})
      </TabsTrigger>
      <TabsTrigger value="strategyLists">
        <FolderKanban className="mr-2 h-4 w-4" aria-hidden="true" />
        Strategies ({strategiesCount})
      </TabsTrigger>
      <TabsTrigger value="background">
        <Briefcase className="mr-2 h-4 w-4" aria-hidden="true" />
        Background
      </TabsTrigger>
    </TabsList>
  );
}
