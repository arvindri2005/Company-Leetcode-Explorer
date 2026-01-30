"use client";

import { AlertCircle, Lightbulb, Loader2, RefreshCw, UserCheck } from "lucide-react";

import { targetRoleLevelOptions } from "@/features/ai";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { TargetRoleLevel } from "@/shared/types";

/**
 * Props for the StrategyForm component.
 */
interface StrategyFormProps {
  /** The selected target role level. */
  selectedRoleLevel: TargetRoleLevel;
  /** Callback when role level changes. */
  onRoleLevelChange: (value: TargetRoleLevel) => void;
  /** Callback when generate button is clicked. */
  onGenerate: () => void;
  /** Whether the form is disabled. */
  disabled: boolean;
  /** Whether AI is currently generating. */
  isGenerating: boolean;
  /** Whether a saved strategy exists. */
  hasSavedStrategy: boolean;
  /** Whether the user can use AI (cooldown check). */
  canUseAI: boolean;
  /** Whether cooldown is loading. */
  isLoadingCooldown: boolean;
  /** Formatted remaining cooldown time. */
  formattedRemainingTime: string;
  /** Whether user is logged in. */
  isLoggedIn: boolean;
}

/**
 * Renders the strategy generation form with role selection and generate button.
 *
 * @param {StrategyFormProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered strategy form component.
 */
export function StrategyForm({
  selectedRoleLevel,
  onRoleLevelChange,
  onGenerate,
  disabled,
  isGenerating,
  hasSavedStrategy,
  canUseAI,
  isLoadingCooldown,
  formattedRemainingTime,
  isLoggedIn,
}: StrategyFormProps): React.JSX.Element {
  const generateButtonText = hasSavedStrategy
    ? "Regenerate Strategy"
    : "Generate Prep Strategy";
  const generateButtonIcon = hasSavedStrategy ? (
    <RefreshCw className="mr-2 h-5 w-5" />
  ) : (
    <Lightbulb className="mr-2 h-5 w-5" />
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <div className="w-full sm:w-auto sm:max-w-xs">
          <Label
            htmlFor="role-level-select"
            className="mb-1.5 flex items-center text-sm font-medium text-muted-foreground justify-center sm:justify-start"
          >
            <UserCheck size={16} className="mr-2" /> Target Role Level
          </Label>
          <Select
            value={selectedRoleLevel}
            onValueChange={(value) =>
              onRoleLevelChange(value as TargetRoleLevel)
            }
            disabled={disabled}
          >
            <SelectTrigger id="role-level-select" className="w-full">
              <SelectValue placeholder="Select role level" />
            </SelectTrigger>
            <SelectContent>
              {targetRoleLevelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={onGenerate}
          disabled={disabled}
          size="lg"
          className="w-full mt-2 sm:mt-0 sm:w-auto self-center sm:self-end"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {generateButtonIcon}
              {generateButtonText}
            </>
          )}
        </Button>
      </div>
      {!isLoadingCooldown &&
        !canUseAI &&
        isLoggedIn &&
        (!hasSavedStrategy || isGenerating) && (
          <p className="text-xs text-destructive flex items-center">
            <AlertCircle size={14} className="mr-1" />
            AI on cooldown. Available in: {formattedRemainingTime}
          </p>
        )}
    </div>
  );
}
