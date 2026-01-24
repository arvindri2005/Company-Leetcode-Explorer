/**
 * @fileoverview Strategies tab component for profile page
 */
"use client";

import dynamic from "next/dynamic";

import { StrategyListSkeleton } from "@/components/skeletons/strategy-skeleton";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TabsContent } from "@/components/ui/tabs";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import type { SavedStrategyTodoList } from "@/types";

const StrategyListsSection = dynamic(
  () => import("@/features/profile/components/strategy-lists-section"),
  {
    loading: () => <StrategyListSkeleton />,
  },
);

export interface StrategiesTabProps {
  strategyTodoLists: SavedStrategyTodoList[];
  isLoadingStrategyTodoLists: boolean;
  updatingTodoItemId: string | null;
  handleToggleTodoItem: (companyId: string, itemIndex: number, newStatus: boolean) => Promise<void>;
}

/**
 * StrategiesTab component displays user's saved strategy todo lists
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function StrategiesTab({
  strategyTodoLists,
  isLoadingStrategyTodoLists,
  updatingTodoItemId,
  handleToggleTodoItem,
}: StrategiesTabProps) {
  return (
    <TabsContent value="strategyLists">
      <ErrorBoundary
        fallbackRender={(props) => (
          <ProfileTabErrorFallback {...props} tabName="Strategies" />
        )}
      >
        <StrategyListsSection
          strategyTodoLists={strategyTodoLists}
          isLoadingStrategyTodoLists={isLoadingStrategyTodoLists}
          updatingTodoItemId={updatingTodoItemId}
          handleToggleTodoItem={handleToggleTodoItem}
        />
      </ErrorBoundary>
    </TabsContent>
  );
}
