
'use client';

import type { LeetCodeProblem, LastAskedPeriod } from '@/types';
import { lastAskedPeriodOptions } from '@/types'; // Import options
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TagBadge from '@/components/problem/tag-badge';
import { BarChart3, TagsIcon, ListChecks, CalendarClock, PieChartIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend as RechartsLegend, Tooltip as RechartsTooltip } from "recharts";

interface CompanyProblemStatsProps {
  problems: LeetCodeProblem[];
}

const difficultyColors: Record<LeetCodeProblem['difficulty'], string> = {
  Easy: 'hsl(var(--chart-2))',   // Green
  Medium: 'hsl(var(--chart-4))', // Yellow
  Hard: 'hsl(var(--chart-5))',   // Red
};

const lastAskedPeriodColors: Record<LastAskedPeriod, string> = {
  'last_30_days': 'hsl(var(--chart-1))',
  'within_3_months': 'hsl(var(--chart-2))',
  'within_6_months': 'hsl(var(--chart-3))',
  'older_than_6_months': 'hsl(var(--chart-4))',
};


const CompanyProblemStats: React.FC<CompanyProblemStatsProps> = ({ problems }) => {
  if (problems.length === 0) {
    return null;
  }

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

  problems.forEach(problem => {
    difficultyCounts[problem.difficulty]++;
    problem.tags.forEach(tag => {
      tagOccurrences[tag] = (tagOccurrences[tag] || 0) + 1;
    });
    if (problem.lastAskedPeriod) {
      lastAskedCounts[problem.lastAskedPeriod]++;
    }
  });

  const sortedTags = Object.entries(tagOccurrences)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10); // Show top 10 tags

  const difficultyChartData = (['Easy', 'Medium', 'Hard'] as LeetCodeProblem['difficulty'][])
    .map(level => ({
      name: level,
      value: difficultyCounts[level],
      fill: difficultyColors[level],
    }))
    .filter(item => item.value > 0); // Only include difficulties with actual problems

  const difficultyChartConfig = difficultyChartData.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);


  const lastAskedChartData = lastAskedPeriodOptions
    .map(option => ({
      name: option.label, // Use user-friendly label
      value: lastAskedCounts[option.value],
      fill: lastAskedPeriodColors[option.value],
    }))
    .filter(item => item.value > 0); // Only include periods with actual problems
  
  const lastAskedChartConfig = lastAskedChartData.reduce((acc, item) => {
     const key = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
     acc[key] = { label: item.name, color: item.fill };
     return acc;
  }, {} as ChartConfig);


  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    if (percent < 0.03) return null; // Don't render label if slice is too small
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {`${name} (${value})`}
      </text>
    );
  };
  
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-3">
        {
          payload.map((entry: any, index: number) => (
            <li key={`item-${index}`} className="flex items-center">
              <span style={{ backgroundColor: entry.color, width: '10px', height: '10px', marginRight: '5px', display: 'inline-block', borderRadius: '50%' }}></span>
              {entry.value} ({entry.payload.value})
            </li>
          ))
        }
      </ul>
    );
  };


  return (
    <Card className="shadow-md my-8">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Problem Statistics
        </CardTitle>
        <CardDescription>
          Insights into the LeetCode problems commonly asked by this company ({problems.length} Total Problems).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Difficulty Breakdown
          </h3>
          {problems.length > 0 && difficultyChartData.length > 0 ? (
            <ChartContainer config={difficultyChartConfig} className="h-[300px] w-full">
              <RechartsPieChart>
                <RechartsTooltip 
                  contentStyle={{backgroundColor: 'hsl(var(--background))', borderRadius: '0.5rem', borderColor: 'hsl(var(--border))'}}
                  itemStyle={{color: 'hsl(var(--foreground))'}}
                />
                <Pie
                  data={difficultyChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  // label={renderCustomizedLabel} // Optional: if you want labels directly on slices
                >
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                  ))}
                </Pie>
                <RechartsLegend content={renderCustomizedLegend} />
              </RechartsPieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground">No problems to analyze for difficulty distribution.</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <CalendarClock className="mr-2 h-5 w-5 text-muted-foreground" />
            Last Asked Period Breakdown
          </h3>
          {problems.some(p => p.lastAskedPeriod) && lastAskedChartData.length > 0 ? (
            <ChartContainer config={lastAskedChartConfig} className="h-[300px] w-full">
               <RechartsPieChart>
                <RechartsTooltip 
                  contentStyle={{backgroundColor: 'hsl(var(--background))', borderRadius: '0.5rem', borderColor: 'hsl(var(--border))'}}
                  itemStyle={{color: 'hsl(var(--foreground))'}}
                />
                <Pie
                  data={lastAskedChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  // label={renderCustomizedLabel} // Optional
                >
                  {lastAskedChartData.map((entry, index) => (
                    <Cell key={`cell-asked-${index}`} fill={entry.fill} stroke={entry.fill} />
                  ))}
                </Pie>
                <RechartsLegend content={renderCustomizedLegend}/>
              </RechartsPieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground">No "Last Asked Period" data available for these problems or no problems match existing periods.</p>
          )}
        </div>

        {sortedTags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <TagsIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              Most Common Tags (Top {Math.min(sortedTags.length, 10)})
            </h3>
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <TagBadge key={tag} tag={`${tag} (${count})`} className="text-sm px-3 py-1" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyProblemStats;
