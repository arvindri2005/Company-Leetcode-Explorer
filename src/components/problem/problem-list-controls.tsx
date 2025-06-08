
'use client';

import type { LeetCodeProblem, LastAskedPeriod, ProblemStatus, DifficultyFilter, SortKey, LastAskedFilter, StatusFilter } from '@/types'; // Import types directly
import { lastAskedPeriodOptions, PROBLEM_STATUS_OPTIONS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, ArrowUpDown, CalendarDays, Search, CheckSquare } from 'lucide-react';
import React from 'react';

interface ProblemListControlsProps {
  difficultyFilter: DifficultyFilter;
  onDifficultyFilterChange: (filter: DifficultyFilter) => void;
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  lastAskedFilter: LastAskedFilter;
  onLastAskedFilterChange: (filter: LastAskedFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  problemCount: number; // Number of currently displayed problems
  showStatusFilter?: boolean;
}

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
  const statusOptionsToDisplay = PROBLEM_STATUS_OPTIONS.filter(opt => opt.value !== 'none');

  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search problems by title or tag..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10 text-base py-3 rounded-md shadow-sm w-full"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div>
            <Label htmlFor="difficulty-filter" className="mb-1.5 flex items-center text-sm font-medium">
              <Filter size={16} className="mr-2 text-muted-foreground" /> Filter by Difficulty
            </Label>
            <Select
              value={difficultyFilter}
              onValueChange={(value) => onDifficultyFilterChange(value as DifficultyFilter)}
            >
              <SelectTrigger id="difficulty-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="last-asked-filter" className="mb-1.5 flex items-center text-sm font-medium">
              <CalendarDays size={16} className="mr-2 text-muted-foreground" /> Filter by Last Asked
            </Label>
            <Select
              value={lastAskedFilter}
              onValueChange={(value) => onLastAskedFilterChange(value as LastAskedFilter)}
            >
              <SelectTrigger id="last-asked-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {lastAskedPeriodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showStatusFilter && (
            <div>
              <Label htmlFor="status-filter" className="mb-1.5 flex items-center text-sm font-medium">
                <CheckSquare size={16} className="mr-2 text-muted-foreground" /> Filter by Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}
              >
                <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptionsToDisplay.map(option => (
                     <SelectItem key={option.value} value={option.value}>
                       {option.label}
                     </SelectItem>
                  ))}
                  <SelectItem value="none">No Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="sort-key" className="mb-1.5 flex items-center text-sm font-medium">
              <ArrowUpDown size={16} className="mr-2 text-muted-foreground" /> Sort by
            </Label>
            <Select
              value={sortKey}
              onValueChange={(value) => onSortKeyChange(value as SortKey)}
            >
              <SelectTrigger id="sort-key" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="difficulty">Difficulty (Easy-Hard)</SelectItem>
                <SelectItem value="lastAsked">Last Asked (Newest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-right mt-2 sm:mt-0 whitespace-nowrap">
          Displaying {problemCount} problem{problemCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

const ProblemListControls = React.memo(ProblemListControlsComponent);
export default ProblemListControls;
