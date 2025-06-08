
'use client';

import type { LeetCodeProblem, LastAskedPeriod, Company } from '@/types';
import { lastAskedPeriodOptions } from '@/types'; // Import options
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TagBadge from '@/components/problem/tag-badge';
import { ListChecks, CalendarClock, TagsIcon, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyProblemStatsProps {
  company: Company; // New prop
  problems: LeetCodeProblem[]; // Keep for fallback or if stats are not yet populated
  totalProblemsCount?: number; // Keep for displaying total problem count, could be from company.problemCount
}

const difficultyColors: Record<LeetCodeProblem['difficulty'], string> = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-500',
  Hard: 'bg-red-500',
};

const difficultyTextColors: Record<LeetCodeProblem['difficulty'], string> = {
  Easy: 'text-white',
  Medium: 'text-black',
  Hard: 'text-white',
};

const lastAskedPeriodColors: Record<LastAskedPeriod, string> = {
  'last_30_days': 'bg-sky-500',
  'within_3_months': 'bg-blue-500',
  'within_6_months': 'bg-indigo-500',
  'older_than_6_months': 'bg-purple-500',
};
const lastAskedPeriodTextColors: Record<LastAskedPeriod, string> = {
  'last_30_days': 'text-white',
  'within_3_months': 'text-white',
  'within_6_months': 'text-white',
  'older_than_6_months': 'text-white',
};

interface BarSegmentProps {
  label: string;
  value: number;
  total: number;
  bgColor: string;
  textColor: string;
}

const BarSegment: React.FC<BarSegmentProps> = ({ label, value, total, bgColor, textColor }) => {
  if (value === 0 || total === 0) return null;
  const percentage = (value / total) * 100;
  const displayPercentage = percentage.toFixed(1);

  return (
    <div
      className={cn(
        "h-full flex items-center justify-center overflow-hidden transition-all duration-300 ease-out",
        bgColor,
        textColor
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


const CompanyProblemStats: React.FC<CompanyProblemStatsProps> = ({ company, problems, totalProblemsCount }) => {
  const displayTotalProblems = totalProblemsCount ?? company.problemCount ?? problems.length;

  if (displayTotalProblems === 0 && !company.statsLastUpdatedAt) {
     // If no problems AND stats haven't been updated (e.g. new company), don't show stats card.
     // The company page itself will show a "no problems" message.
    return null;
  }

  let difficultyCounts: Required<Company['difficultyCounts']>;
  let recencyCounts: Required<Company['recencyCounts']>;
  let commonTags: Required<Company['commonTags']>;
  let problemsWithRecencyData = 0;

  // Prioritize using denormalized stats if available and seemingly valid
  if (company.statsLastUpdatedAt && company.difficultyCounts && company.recencyCounts && company.commonTags) {
    difficultyCounts = company.difficultyCounts;
    recencyCounts = company.recencyCounts;
    commonTags = company.commonTags;
    problemsWithRecencyData = Object.values(recencyCounts).reduce((sum, count) => sum + count, 0);
  } else {
    // Fallback to calculating from problems prop if denormalized stats are missing
    difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    const tagOccurrences: Record<string, number> = {};
    recencyCounts = {
      last_30_days: 0,
      within_3_months: 0,
      within_6_months: 0,
      older_than_6_months: 0,
    };

    problems.forEach(problem => {
      difficultyCounts[problem.difficulty]++;
      problem.tags.forEach(tag => {
        tagOccurrences[tag] = (tagOccurrences[tag] || 0) + 1;
      });
      if (problem.lastAskedPeriod) {
        recencyCounts[problem.lastAskedPeriod]++;
        problemsWithRecencyData++;
      }
    });

    commonTags = Object.entries(tagOccurrences)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  }

  const difficultyOrder: LeetCodeProblem['difficulty'][] = ['Easy', 'Medium', 'Hard'];
  const lastAskedOrder: LastAskedPeriod[] = ['last_30_days', 'within_3_months', 'within_6_months', 'older_than_6_months'];

  return (
    <Card className="shadow-sm my-4">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center text-base">
          <ListChecks className="mr-1.5 h-4 w-4 text-primary" />
          Problem Statistics
        </CardTitle>
        <CardDescription className="text-xs">
          Breakdown of {displayTotalProblems} problem{displayTotalProblems === 1 ? '' : 's'}.
          {company.statsLastUpdatedAt && (
            <span className="block text-xs text-muted-foreground/80">
              Stats last updated: {new Date(company.statsLastUpdatedAt).toLocaleDateString()}
            </span>
          )}
           {!company.statsLastUpdatedAt && displayTotalProblems > 0 && (
            <span className="block text-xs text-amber-600">
              Overall company stats are pending update (run admin action). Current stats are based on loaded problems.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-1.5">
        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <Percent size={14} className="mr-1 text-muted-foreground" />
            Difficulty Distribution
          </h3>
          {displayTotalProblems > 0 || Object.values(difficultyCounts).some(c => c > 0) ? (
            <div className="w-full h-5 flex rounded-sm overflow-hidden border border-border bg-muted">
              {difficultyOrder.map(level => (
                <BarSegment
                  key={level}
                  label={level}
                  value={difficultyCounts[level]}
                  total={displayTotalProblems} // Use displayTotalProblems as the denominator
                  bgColor={difficultyColors[level]}
                  textColor={difficultyTextColors[level]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No problems to analyze for difficulty.</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <CalendarClock size={14} className="mr-1 text-muted-foreground" />
            Recency Distribution
          </h3>
          {problemsWithRecencyData > 0 || Object.values(recencyCounts).some(c => c > 0) ? (
            <div className="w-full h-5 flex rounded-sm overflow-hidden border border-border bg-muted">
              {lastAskedOrder.map(period => (
                <BarSegment
                  key={period}
                  label={lastAskedPeriodOptions.find(opt => opt.value === period)?.label || period}
                  value={recencyCounts[period]}
                  total={problemsWithRecencyData} // Base percentage on problems *with* recency data
                  bgColor={lastAskedPeriodColors[period]}
                  textColor={lastAskedPeriodTextColors[period]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No "Last Asked Period" data available.</p>
          )}
        </div>

        {commonTags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-1 flex items-center">
              <TagsIcon size={14} className="mr-1 text-muted-foreground" />
              Most Common Tags (Top {Math.min(commonTags.length, 8)})
            </h3>
            <div className="flex flex-wrap gap-1">
              {commonTags.map(({tag, count}) => (
                <TagBadge key={tag} tag={`${tag} (${count})`} className="text-xs px-1.5 py-0.5" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyProblemStats;
    