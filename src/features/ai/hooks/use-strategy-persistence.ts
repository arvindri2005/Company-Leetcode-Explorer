"use client";

import { useCallback, useState } from "react";

import { userService } from "@/features/profile/services/user.service";
import type { GenerateCompanyStrategyOutput } from "@/types";

/**
 * Interface for the strategy persistence hook.
 */
export interface StrategyPersistenceHook {
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** Whether a load operation is in progress. */
  isLoading: boolean;
  /** Whether a saved strategy exists. */
  hasSavedStrategy: boolean;
  /** Any error that occurred during persistence operations. */
  error: Error | null;
  /** Function to save a strategy. */
  saveStrategy: (
    userId: string,
    companyId: string,
    companyName: string,
    strategy: GenerateCompanyStrategyOutput
  ) => Promise<boolean>;
  /** Function to load a saved strategy. */
  loadStrategy: (
    userId: string,
    companyId: string
  ) => Promise<GenerateCompanyStrategyOutput | null>;
  /** Function to set the saved strategy flag. */
  setHasSavedStrategy: (value: boolean) => void;
}

/**
 * Custom hook for managing strategy persistence (save/load from Firestore).
 *
 * @returns {StrategyPersistenceHook} The strategy persistence hook interface.
 */
export function useStrategyPersistence(): StrategyPersistenceHook {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedStrategy, setHasSavedStrategy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveStrategy = async (
    userId: string,
    companyId: string,
    companyName: string,
    strategy: GenerateCompanyStrategyOutput
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await userService.saveStrategyTodoList(
        userId,
        companyId,
        companyName,
        {
          preparationStrategy: strategy.preparationStrategy,
          focusTopics: strategy.focusTopics,
          todoItems: strategy.todoItems,
        }
      );

      setIsSaving(false);

      if (result.isSuccess) {
        setHasSavedStrategy(true);
        return true;
      } else {
        const errorMessage =
          result.error?.message || "Could not save the strategy.";
        setError(new Error(errorMessage));
        return false;
      }
    } catch (err) {
      setIsSaving(false);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return false;
    }
  };

  const loadStrategy = useCallback(
    async (
      userId: string,
      companyId: string
    ): Promise<GenerateCompanyStrategyOutput | null> => {
      setIsLoading(true);
      setError(null);
      setHasSavedStrategy(false);

      try {
        const result = await userService.getStrategyTodoListForCompany(
          userId,
          companyId
        );

        setIsLoading(false);

        if (result.isSuccess && result.value) {
          const loadedStrategy: GenerateCompanyStrategyOutput = {
            preparationStrategy: result.value.preparationStrategy,
            focusTopics: result.value.focusTopics,
            todoItems: result.value.items,
          };
          setHasSavedStrategy(true);
          return loadedStrategy;
        }

        return null;
      } catch (err) {
        setIsLoading(false);
        const error = err instanceof Error ? err : new Error("Unknown error");
        // Don't set error for "not found" cases
        if (error.message !== "Todo list not found.") {
          setError(error);
        }
        return null;
      }
    },
    []
  );

  return {
    isSaving,
    isLoading,
    hasSavedStrategy,
    error,
    saveStrategy,
    loadStrategy,
    setHasSavedStrategy,
  };
}
