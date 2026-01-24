/**
 * @fileoverview Profile content container component that wraps tab content
 */
"use client";

import { type ReactNode } from "react";

import { Tabs } from "@/components/ui/tabs";

import { ProfileTabs } from "./profile-tabs";

export interface ProfileContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bookmarksCount: number;
  solvedCount: number;
  attemptedCount: number;
  todoCount: number;
  strategiesCount: number;
  children: ReactNode;
}

/**
 * ProfileContent component wraps the tabs navigation and tab content
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function ProfileContent({
  activeTab,
  setActiveTab,
  bookmarksCount,
  solvedCount,
  attemptedCount,
  todoCount,
  strategiesCount,
  children,
}: ProfileContentProps) {
  return (
    <div className="lg:col-span-8 xl:col-span-9">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ProfileTabs
          bookmarksCount={bookmarksCount}
          solvedCount={solvedCount}
          attemptedCount={attemptedCount}
          todoCount={todoCount}
          strategiesCount={strategiesCount}
        />
        {children}
      </Tabs>
    </div>
  );
}
