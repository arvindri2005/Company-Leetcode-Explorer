/**
 * @fileoverview A client-side component to display aggregated statistics about a company's problems.
 *
 * This component visualizes pre-calculated statistics for a company's coding
 * problems, including the distribution of difficulty levels and how recently
 * problems were asked. It also lists the most common tags associated with the
 * company's problems.
 */
"use client";

import type { LeetCodeProblem, LastAskedPeriod, Company } from "@/types";
import { lastAskedPeriodOptions } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import TagBadge from "@/components/problem/tag-badge";
import { ListChecks, CalendarClock, TagsIcon, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the CompanyProblemStats component.
 */
interface CompanyProblemStatsProps {
  company: Company;
}

const difficultyColors: Record<LeetCodeProblem["difficulty"], string> = {
  Easy: "bg-green-500",
  Medium: "bg-yellow-500",
  Hard: "bg-red-500",
};

const difficultyTextColors: Record<LeetCodeProblem["difficulty"], string> = {
  Easy: "text-white",
  Medium: "text-black",
  Hard: "text-white",
};

const lastAskedPeriodColors: Record<LastAskedPeriod, string> = {
  last_30_days: "bg-sky-500",
  within_3_months: "bg-blue-500",
  within_6_months: "bg-indigo-500",
  older_than_6_months: "bg-purple-500",
};
const lastAskedPeriodTextColors: Record<LastAskedPeriod, string> = {
  last_30_days: "text-white",
  within_3_months: "text-white",
  within_6_months: "text-white",
  older_than_6_months: "text-white",
};

/**
 * Props for the BarSegment component.
 */
interface BarSegmentProps {
  label: string;
  value: number;
  total: number;
  bgColor: string;
  textColor: string;
}

/**
 * Renders a single colored segment within a composite progress bar.
 * The width of the segment is proportional to its value relative to the total.
 *
 * @param {BarSegmentProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered bar segment, or null if its value is zero.
 */
const BarSegment: React.FC<BarSegmentProps> = ({
  label,
  value,
  total,
  bgColor,
  textColor,
}) => {
  if (value === 0 || total === 0) return null;
  const percentage = (value / total) * 100;
  const displayPercentage = percentage.toFixed(1);

  return (
    <div
      className={cn(
        "h-full flex items-center justify-center overflow-hidden transition-all duration-300 ease-out",
        bgColor,
        textColor,
      )}
      style={{ width: `${percentage}%` }}
      title={`${label}: ${value} (${displayPercentage}%)`}
    >
      {percentage > 15 ? (
        <div className="truncate px-1.5 text-xs font-medium">
          <span className="hidden sm:inline">{label} </span>({value})
        </div>
      ) : percentage > 8 ? (
        <div className="truncate px-1 text-xs font-medium">({value})</div>
      ) : null}
    </div>
  );
};

/**
 * Renders a card displaying various statistics about a company's interview problems.
 *
 * This component visualizes the breakdown of problems by difficulty and recency
 * using composite bar charts. It also lists the most frequently occurring tags.
 * The component will only render if the necessary pre-calculated statistics are
 * available in the `company` prop.
 *
 * @param {CompanyProblemStatsProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered statistics card, or null if stats are unavailable.
 */
const CompanyProblemStats: React.FC<CompanyProblemStatsProps> = ({
  company,
}) => {
  const {
    statsLastUpdatedAt,
    difficultyCounts,
    recencyCounts,
    commonTags,
    problemCount,
  } = company;

  // If pre-calculated stats are not available, don't render the component.
  if (
    !statsLastUpdatedAt ||
    !difficultyCounts ||
    !recencyCounts ||
    !commonTags
  ) {
    return null;
  }

  const displayTotalProblems = problemCount ?? 0;
  const problemsWithRecencyData = Object.values(recencyCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const difficultyOrder: LeetCodeProblem["difficulty"][] = [
    "Easy",
    "Medium",
    "Hard",
  ];
  const lastAskedOrder: LastAskedPeriod[] = [
    "last_30_days",
    "within_3_months",
    "within_6_months",
    "older_than_6_months",
  ];

  return (
    <Card className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center text-base">
          <ListChecks className="mr-1.5 h-4 w-4 text-primary" />
          Problem Statistics
        </CardTitle>
        <CardDescription className="text-xs">
          Breakdown of {displayTotalProblems} problem
          {displayTotalProblems === 1 ? "" : "s"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-1.5">
        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <Percent size={14} className="mr-1 text-muted-foreground" />
            Difficulty Distribution
          </h3>
          {displayTotalProblems > 0 ? (
            <div className="w-full h-5 flex rounded-md overflow-hidden border border-border bg-muted">
              {difficultyOrder.map((level) => (
                <BarSegment
                  key={level}
                  label={level}
                  value={difficultyCounts[level]}
                  total={displayTotalProblems}
                  bgColor={difficultyColors[level]}
                  textColor={difficultyTextColors[level]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No problems to analyze for difficulty.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <CalendarClock size={14} className="mr-1 text-muted-foreground" />
            Recency Distribution
          </h3>
          {problemsWithRecencyData > 0 ? (
            <div className="w-full h-5 flex rounded-md overflow-hidden border border-border bg-muted">
              {lastAskedOrder.map((period) => (
                <BarSegment
                  key={period}
                  label={
                    lastAskedPeriodOptions.find((opt) => opt.value === period)
                      ?.label || period
                  }
                  value={recencyCounts[period]}
                  total={problemsWithRecencyData}
                  bgColor={lastAskedPeriodColors[period]}
                  textColor={lastAskedPeriodTextColors[period]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No "Last Asked Period" data available.
            </p>
          )}
        </div>

        {commonTags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-1 flex items-center">
              <TagsIcon size={14} className="mr-1 text-muted-foreground" />
              Most Common Tags (Top {Math.min(commonTags.length, 8)})
            </h3>
            <div className="flex flex-wrap gap-1">
              {commonTags.map(({ tag, count }) => (
                <TagBadge
                  key={tag}
                  tag={`${tag} (${count})`}
                  className="text-xs px-1.5 py-0.5"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyProblemStats;
