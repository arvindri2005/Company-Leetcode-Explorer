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
import { ChipGroup } from "../ui/chip-group";

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

  return (
    <div className="mb-6 p-4 bg-card rounded-xl shadow space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <ChipGroup
            options={difficultyOptions}
            value={difficultyFilter}
            onChange={onDifficultyFilterChange}
            multiple
          />
        </div>
        <div>
          <ChipGroup
            options={lastAskedPeriodOptions}
            value={lastAskedFilter}
            onChange={onLastAskedFilterChange}
            multiple
          />
        </div>
        {showStatusFilter && (
          <div>
            <ChipGroup
              options={statusOptions}
              value={statusFilter}
              onChange={onStatusFilterChange}
              multiple
            />
          </div>
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
