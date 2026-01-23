"use client";

import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Props for the StrategyActions component.
 */
interface StrategyActionsProps {
  /** Callback when save button is clicked. */
  onSave: () => void;
  /** Whether the save operation is in progress. */
  isSaving: boolean;
  /** Whether the component is disabled. */
  disabled: boolean;
  /** Whether this is a saved strategy (affects button text). */
  hasSavedStrategy: boolean;
}

/**
 * Renders action buttons for the strategy (save/update).
 *
 * @param {StrategyActionsProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered strategy actions component.
 */
export function StrategyActions({
  onSave,
  isSaving,
  disabled,
  hasSavedStrategy,
}: StrategyActionsProps): React.JSX.Element {
  return (
    <Button onClick={onSave} disabled={disabled} size="sm">
      {isSaving ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {hasSavedStrategy ? "Update Saved Strategy" : "Save Strategy"}
    </Button>
  );
}
