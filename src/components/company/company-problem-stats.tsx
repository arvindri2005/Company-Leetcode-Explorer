
'use client';

import type { LeetCodeProblem, LastAskedPeriod } from '@/types';
import { lastAskedPeriodOptions } from '@/types'; // Import options
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TagBadge from '@/components/problem/tag-badge';
import { ListChecks, CalendarClock, TagsIcon, Percent } from 'lucide-react'; // Added Percent icon
import { cn } from '@/lib/utils';

interface CompanyProblemStatsProps {
  problems: LeetCodeProblem[];
}

const difficultyColors: Record<LeetCodeProblem['difficulty'], string> = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-500',
  Hard: 'bg-red-500',
};

const difficultyTextColors: Record<LeetCodeProblem['difficulty'], string> = {
  Easy: 'text-white',
  Medium: 'text-black', // Yellow usually needs black text for contrast
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
  if (value === 0) return null;
  const percentage = total > 0 ? (value / total) * 100 : 0;
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


const CompanyProblemStats: React.FC<CompanyProblemStatsProps> = ({ problems }) => {
  if (problems.length === 0) {
    return null;
  }

  const totalProblems = problems.length;

  const difficultyCounts: Record<LeetCodeProblem['difficulty'], number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  const tagOccurrences: Record<string, number> = {};
  
  const lastAskedCounts: Record<LastAskedPeriod, number> = {
    'last_30_days': 0,
    'within_3_months': 0,
    'within_6_months': 0,
    'older_than_6_months': 0,
  };
  let problemsWithLastAskedData = 0;

  problems.forEach(problem => {
    difficultyCounts[problem.difficulty]++;
    problem.tags.forEach(tag => {
      tagOccurrences[tag] = (tagOccurrences[tag] || 0) + 1;
    });
    if (problem.lastAskedPeriod) {
      lastAskedCounts[problem.lastAskedPeriod]++;
      problemsWithLastAskedData++;
    }
  });

  const sortedTags = Object.entries(tagOccurrences)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 8); // Show top 8 tags

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
          Breakdown of {totalProblems} problem{totalProblems === 1 ? '' : 's'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-1.5">
        {/* Difficulty Breakdown */}
        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <Percent size={14} className="mr-1 text-muted-foreground" />
            Difficulty Distribution
          </h3>
          {totalProblems > 0 ? (
            <div className="w-full h-5 flex rounded-sm overflow-hidden border border-border bg-muted">
              {difficultyOrder.map(level => (
                <BarSegment
                  key={level}
                  label={level}
                  value={difficultyCounts[level]}
                  total={totalProblems}
                  bgColor={difficultyColors[level]}
                  textColor={difficultyTextColors[level]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No problems to analyze for difficulty.</p>
          )}
        </div>

        {/* Last Asked Period Breakdown */}
        <div>
          <h3 className="text-xs font-semibold mb-1 flex items-center">
            <CalendarClock size={14} className="mr-1 text-muted-foreground" />
            Recency Distribution
          </h3>
          {problemsWithLastAskedData > 0 ? (
            <div className="w-full h-5 flex rounded-sm overflow-hidden border border-border bg-muted">
              {lastAskedOrder.map(period => (
                <BarSegment
                  key={period}
                  label={lastAskedPeriodOptions.find(opt => opt.value === period)?.label || period}
                  value={lastAskedCounts[period]}
                  total={problemsWithLastAskedData}
                  bgColor={lastAskedPeriodColors[period]}
                  textColor={lastAskedPeriodTextColors[period]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No "Last Asked Period" data available.</p>
          )}
        </div>

        {/* Most Common Tags */}
        {sortedTags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-1 flex items-center">
              <TagsIcon size={14} className="mr-1 text-muted-foreground" />
              Most Common Tags (Top {Math.min(sortedTags.length, 8)})
            </h3>
            <div className="flex flex-wrap gap-1">
              {sortedTags.map(([tag, count]) => (
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
