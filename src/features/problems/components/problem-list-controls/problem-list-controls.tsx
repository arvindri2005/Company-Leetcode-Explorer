/**
 * @fileoverview A client-side component for filtering and sorting a list of problems.
 *
 * This component provides a set of UI controls (dropdowns and a search input)
 * that allow the user to filter a list of coding problems by difficulty,
 * recency, and status, as well as sort the list. It is a controlled component,
 * with its state managed by a parent.
 */
"use client";

import React from "react";

import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Chip } from "@/shared/components/ui/chip";

import { lastAskedPeriodOptions, PROBLEM_STATUS_OPTIONS } from "../../constants";
import type {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  StatusFilter,
} from "../../types";

/**
 * Props for the ProblemListControls component.
 */
interface ProblemListControlsProps {
  difficultyFilter: DifficultyFilter[];
  onDifficultyFilterChange: (filter: DifficultyFilter[]) => void;
  lastAskedFilter: LastAskedFilter[];
  onLastAskedFilterChange: (filter: LastAskedFilter[]) => void;
  statusFilter: StatusFilter[];
  onStatusFilterChange: (filter: StatusFilter[]) => void;
  onClearAll?: () => void;
  sortKey?: SortKey;
  onSortKeyChange?: (sortKey: SortKey) => void;
  showStatusFilter?: boolean;
}

/**
 * The core component for rendering the filter and sort controls for a problem list.
 *
 * This component is designed to be fully controlled by its parent. It receives the
 * current filter and sort values as props and calls callback functions when the user
 * changes a selection. This allows the parent component to handle the logic of
 * re-fetching or re-filtering the problem data.
 *
 * @param {ProblemListControlsProps} props - The props for configuring the controls.
 * @returns {JSX.Element} The rendered controls component.
 */
const ProblemListControlsComponent: React.FC<ProblemListControlsProps> = ({
  difficultyFilter,
  onDifficultyFilterChange,
  lastAskedFilter,
  onLastAskedFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearAll,
  sortKey: _sortKey,
  onSortKeyChange: _onSortKeyChange,
  showStatusFilter = false,
}) => {
  const statusOptionsToDisplay = PROBLEM_STATUS_OPTIONS.filter(
    (opt) => opt.value !== "none",
  );

  const difficultyOptions = [
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];

  const statusOptions = [
    ...statusOptionsToDisplay,
    { value: "none", label: "No Status" },
  ];

  // Helper to handle array toggling
  const toggleFilter = <T extends string>(
    currentValues: T[],
    valueToToggle: T,
    onChange: (newValues: T[]) => void,
  ) => {
    const newValues = [...currentValues];
    const index = newValues.indexOf(valueToToggle);
    if (index > -1) {
      newValues.splice(index, 1);
    } else {
      newValues.push(valueToToggle);
    }
    onChange(newValues);
  };

  const chipClassName = "px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm";

  const hasActiveFilters =
    difficultyFilter.length > 0 ||
    lastAskedFilter.length > 0 ||
    (showStatusFilter && statusFilter.length > 0);

  return (
    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-card rounded-xl shadow">
      <div className="flex flex-wrap gap-2">
        <div
          role="group"
          aria-label="Filter by difficulty"
          className="contents"
        >
          {difficultyOptions.map((option) => (
            <Chip
              key={`difficulty-${option.value}`}
              selected={difficultyFilter.includes(
                option.value as DifficultyFilter,
              )}
              onClick={() =>
                toggleFilter(
                  difficultyFilter,
                  option.value as DifficultyFilter,
                  onDifficultyFilterChange,
                )
              }
              className={chipClassName}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        <div role="group" aria-label="Filter by recency" className="contents">
          {lastAskedPeriodOptions.map((option) => (
            <Chip
              key={`recency-${option.value}`}
              selected={lastAskedFilter.includes(
                option.value as LastAskedFilter,
              )}
              onClick={() =>
                toggleFilter(
                  lastAskedFilter,
                  option.value as LastAskedFilter,
                  onLastAskedFilterChange,
                )
              }
              className={chipClassName}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        {showStatusFilter && (
          <div role="group" aria-label="Filter by status" className="contents">
            {statusOptions.map((option) => (
              <Chip
                key={`status-${option.value}`}
                selected={statusFilter.includes(option.value as StatusFilter)}
                onClick={() =>
                  toggleFilter(
                    statusFilter,
                    option.value as StatusFilter,
                    onStatusFilterChange,
                  )
                }
                className={chipClassName}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              if (onClearAll) {
                onClearAll();
              } else {
                onDifficultyFilterChange([]);
                onLastAskedFilterChange([]);
                onStatusFilterChange([]);
              }
            }}
            className={`${chipClassName} h-auto text-muted-foreground hover:text-foreground`}
          >
            <X className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * A memoized version of the `ProblemListControlsComponent` to optimize performance
 * by preventing unnecessary re-renders when props have not changed.
 */
const ProblemListControls = React.memo(ProblemListControlsComponent);
export default ProblemListControls;






