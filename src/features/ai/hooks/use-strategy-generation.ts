"use client";

import { useState } from "react";

import { generateCompanyStrategyAction } from "@/app/actions/ai.actions";
import type { GenerateCompanyStrategyOutput, TargetRoleLevel } from "@/types";

/**
 * Interface for the strategy generation hook.
 */
export interface StrategyGenerationHook {
  /** The generated strategy data. */
  strategy: GenerateCompanyStrategyOutput | null;
  /** Whether AI is currently generating. */
  isGenerating: boolean;
  /** Any error that occurred during generation. */
  error: Error | null;
  /** Function to generate a new strategy. */
  generateStrategy: (
    companyId: string,
    companyName: string,
    roleLevel?: TargetRoleLevel
  ) => Promise<GenerateCompanyStrategyOutput | null>;
  /** Function to set strategy data directly. */
  setStrategy: (strategy: GenerateCompanyStrategyOutput | null) => void;
}

/**
 * Custom hook for managing AI strategy generation.
 *
 * @returns {StrategyGenerationHook} The strategy generation hook interface.
 */
export function useStrategyGeneration(): StrategyGenerationHook {
  const [strategy, setStrategy] = useState<GenerateCompanyStrategyOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateStrategy = async (
    companyId: string,
    companyName: string,
    roleLevel?: TargetRoleLevel
  ): Promise<GenerateCompanyStrategyOutput | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCompanyStrategyAction(
        companyId,
        roleLevel === "general" ? undefined : roleLevel
      );

      setIsGenerating(false);

      if (
        !result.success ||
        !result.data ||
        !result.data.preparationStrategy ||
        !result.data.focusTopics ||
        !result.data.todoItems
      ) {
        const errorMessage =
          result.error?.message || "Could not generate a strategy at this time.";
        const err = new Error(errorMessage);
        setError(err);
        return null;
      }

      setStrategy(result.data);
      return result.data;
    } catch (err) {
      setIsGenerating(false);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return null;
    }
  };

  return {
    strategy,
    isGenerating,
    error,
    generateStrategy,
    setStrategy,
  };
}
