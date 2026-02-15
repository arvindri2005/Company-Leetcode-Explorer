/**
 * @fileoverview Hook for fetching and managing strategy todo lists
 */
"use client";

import { useCallback, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/shared/hooks/use-toast";
import type { SavedStrategyTodoList } from "@/shared/types";

export interface StrategiesData {
  strategyTodoLists: SavedStrategyTodoList[];
  isLoadingStrategyTodoLists: boolean;
  hasFetchedStrategyLists: boolean;
  updatingTodoItemId: string | null;
  fetchStrategyTodoLists: () => Promise<void>;
  handleToggleTodoItem: (companyId: string, itemIndex: number, newStatus: boolean) => Promise<void>;
}

/**
 * Hook for managing strategy todo lists
 * 
 * @param user - Supabase user object
 * @returns StrategiesData object with strategy data and functions
 */
export function useStrategies(user: User | null): StrategiesData {
  const { toast } = useToast();
  const [strategyTodoLists, setStrategyTodoLists] = useState<SavedStrategyTodoList[]>([]);
  const [isLoadingStrategyTodoLists, setIsLoadingStrategyTodoLists] = useState(false);
  const [hasFetchedStrategyLists, setHasFetchedStrategyLists] = useState(false);
  const [updatingTodoItemId, setUpdatingTodoItemId] = useState<string | null>(null);

  const fetchStrategyTodoLists = useCallback(async () => {
    if (user?.id) {
      setIsLoadingStrategyTodoLists(true);
      try {
        const result = await userService.getUserStrategyTodoLists(user.id);
        if (result.isSuccess) {
          setStrategyTodoLists(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch saved strategy todo lists.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch saved strategy todo lists.",
          variant: "destructive",
        });
      }
      setIsLoadingStrategyTodoLists(false);
      setHasFetchedStrategyLists(true);
    } else {
      setStrategyTodoLists([]);
    }
  }, [user, toast]);

  const handleToggleTodoItem = useCallback(
    async (companyId: string, itemIndex: number, newStatus: boolean) => {
      if (!user) {
        return;
      }
      const todoItemId = `${companyId}-${itemIndex}`;
      setUpdatingTodoItemId(todoItemId);
      const originalLists = [...strategyTodoLists]; // Keep a copy for optimistic update rollback

      // Optimistic UI update
      setStrategyTodoLists((prevLists) =>
        prevLists.map((list) =>
          list.companyId === companyId
            ? {
                ...list,
                items: list.items.map((item, index) =>
                  index === itemIndex
                    ? { ...item, isCompleted: newStatus }
                    : item,
                ),
              }
            : list,
        ),
      );

      const result = await userService.updateStrategyTodoItemStatus(
        user.id,
        companyId,
        itemIndex,
        newStatus,
      );
      setUpdatingTodoItemId(null);

      if (!result.isSuccess) {
        toast({
          title: "Update Failed",
          description: result.error.message || "Could not update item status.",
          variant: "destructive",
        });
        setStrategyTodoLists(originalLists); // Rollback UI on failure
      }
    },
    [user, strategyTodoLists, toast],
  );

  return {
    strategyTodoLists,
    isLoadingStrategyTodoLists,
    hasFetchedStrategyLists,
    updatingTodoItemId,
    fetchStrategyTodoLists,
    handleToggleTodoItem,
  };
}
