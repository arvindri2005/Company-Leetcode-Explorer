/**
 * @fileoverview A client-side component to display redesigned, graphical statistics about a company's problems.
 *
 * This component visualizes pre-calculated statistics for a company's coding
 * problems, including difficulty levels, recency, and common tags, using a
 * modern and engaging graphical format.
 */
"use client";

import type { Company, LeetCodeProblem, LastAskedPeriod } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CalendarClock, TagsIcon } from "lucide-react";
import TagBadge from "@/components/problem/tag-badge";

/**
 * Props for the CompanyProblemStats component.
 */
interface CompanyProblemStatsProps {
  company: Company;
}

import { COLORS } from "@/constants/colors";

const difficultyColors: Record<LeetCodeProblem["difficulty"], string> = {
  Easy: COLORS.difficulty.easy,
  Medium: COLORS.difficulty.medium,
  Hard: COLORS.difficulty.hard,
};

const recencyColors: Record<LastAskedPeriod, string> = {
  last_30_days: COLORS.stat.blue,
  within_3_months: COLORS.stat.indigo,
  within_6_months: COLORS.stat.violet,
  older_than_6_months: COLORS.stat.purple,
};

/**
 * Renders a redesigned card displaying graphical statistics about a company's problems.
 *
 * This component uses bar charts to visualize the distribution of problem
 * difficulties and recency. It also lists the most common tags in a clean,
 * modern layout. The component only renders if the necessary stats are available.
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

  if (
    !statsLastUpdatedAt ||
    !difficultyCounts ||
    !recencyCounts ||
    !commonTags
  ) {
    return null;
  }

  const difficultyData = [
    { name: "Easy", count: difficultyCounts.Easy },
    { name: "Medium", count: difficultyCounts.Medium },
    { name: "Hard", count: difficultyCounts.Hard },
  ];

  const recencyData = [
    { name: "1 month", count: recencyCounts.last_30_days },
    { name: "3 months", count: recencyCounts.within_3_months },
    { name: "6 months", count: recencyCounts.within_6_months },
    { name: ">6 months", count: recencyCounts.older_than_6_months },
  ];

  return (
    <Card className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <CardHeader className="py-2 px-3">
        <h2 className="font-semibold leading-none tracking-tight flex items-center text-lg">
          <ListChecks className="mr-2 h-5 w-5 text-primary" />
          Problem Statistics
        </h2>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 px-3 pt-4">
        <div>
          <h3 className="text-md font-semibold mb-4 text-center">
            Difficulty Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={difficultyData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke={COLORS.grayCustom.stroke}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
                        <p className="font-medium text-popover-foreground text-sm">
                          {label}
                        </p>
                        <p className="text-primary font-bold text-sm">
                          {payload[0].value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
                {difficultyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      difficultyColors[
                        entry.name as LeetCodeProblem["difficulty"]
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-4 text-center">
            Recency Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recencyData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke={COLORS.grayCustom.stroke}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
                        <p className="font-medium text-popover-foreground text-sm">
                          {label}
                        </p>
                        <p className="text-primary font-bold text-sm">
                          {payload[0].value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
                {recencyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      recencyColors[
                        Object.keys(recencyColors)[
                          index
                        ] as LastAskedPeriod
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {commonTags.length > 0 && (
          <div className="md:col-span-2">
            <h3 className="text-md font-semibold mb-3 flex items-center">
              <TagsIcon size={18} className="mr-2 text-muted-foreground" />
              Most Common Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {commonTags.map(({ tag, count }) => (
                <TagBadge
                  key={tag}
                  tag={`${tag} (${count})`}
                  className="text-sm px-2 py-1"
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
