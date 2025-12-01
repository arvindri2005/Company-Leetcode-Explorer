/**
 * @fileoverview A client-side component for filtering and sorting a list of problems.
 *
 * This component provides a set of UI controls (dropdowns and a search input)
 * that allow the user to filter a list of coding problems by difficulty,
 * recency, and status, as well as sort the list. It is a controlled component,
 * with its state managed by a parent.
 */
"use client";

import type {
  DifficultyFilter,
  SortKey,
  LastAskedFilter,
  StatusFilter,
} from "@/types";
import { lastAskedPeriodOptions, PROBLEM_STATUS_OPTIONS } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, ArrowUpDown, CalendarDays, CheckSquare } from "lucide-react";
import React from "react";
import { Chip } from "@/components/ui/chip";

/**
 * Props for the ProblemListControls component.
 */
interface ProblemListControlsProps {
  difficultyFilter: DifficultyFilter[];
  onDifficultyFilterChange: (filter: DifficultyFilter[]) => void;
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  lastAskedFilter: LastAskedFilter[];
  onLastAskedFilterChange: (filter: LastAskedFilter[]) => void;
  statusFilter: StatusFilter[];
  onStatusFilterChange: (filter: StatusFilter[]) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  problemCount: number;
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
  sortKey,
  onSortKeyChange,
  lastAskedFilter,
  onLastAskedFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  problemCount,
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

  return (
    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-card rounded-xl shadow">
      <div className="flex flex-wrap gap-2">
        {difficultyOptions.map((option) => (
          <Chip
            key={`difficulty-${option.value}`}
            selected={difficultyFilter.includes(option.value as DifficultyFilter)}
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

        {lastAskedPeriodOptions.map((option) => (
          <Chip
            key={`recency-${option.value}`}
            selected={lastAskedFilter.includes(option.value as LastAskedFilter)}
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

        {showStatusFilter &&
          statusOptions.map((option) => (
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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-4">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {problemCount} Problems
        </div>
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
