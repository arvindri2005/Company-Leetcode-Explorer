"use client";

import React from "react";

import { BarChart3, CheckCircle2, ListTodo, Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

/**
 * @interface ProgressStatsProps
 * @description Props for the ProgressStats component.
 * @property {object} stats - An object containing the user's problem-solving statistics.
 * @property {number} stats.solved - The number of problems the user has solved.
 * @property {number} stats.attempted - The number of problems the user has attempted.
 * @property {number} stats.todo - The number of problems the user has marked as to-do.
 */
interface ProgressStatsProps {
  stats: {
    solved: number;
    attempted: number;
    todo: number;
  };
}

/**
 * @function ProgressStats
 * @description A component that displays a user's problem-solving statistics in a card format.
 * @param {ProgressStatsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered card with progress statistics.
 */
const ProgressStats: React.FC<ProgressStatsProps> = ({ stats }) => {
  return (
    <Card className="bg-card border border-border rounded-xl  mb-8 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <BarChart3 className="mr-3 text-primary" aria-hidden="true" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-muted/30 rounded-lg">
          <CheckCircle2
            className="h-8 w-8 mx-auto mb-2 text-green-500"
            aria-hidden="true"
          />
          <p className="text-3xl font-bold">{stats.solved}</p>
          <p className="text-sm text-muted-foreground">Solved</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <Pencil
            className="h-8 w-8 mx-auto mb-2 text-yellow-500"
            aria-hidden="true"
          />
          <p className="text-3xl font-bold">{stats.attempted}</p>
          <p className="text-sm text-muted-foreground">Attempted</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <ListTodo
            className="h-8 w-8 mx-auto mb-2 text-blue-500"
            aria-hidden="true"
          />
          <p className="text-3xl font-bold">{stats.todo}</p>
          <p className="text-sm text-muted-foreground">To-Do</p>
        </div>
      </CardContent>
    </Card>
  );
};

function arePropsEqual(prevProps: ProgressStatsProps, nextProps: ProgressStatsProps) {
  return (
    prevProps.stats.solved === nextProps.stats.solved &&
    prevProps.stats.attempted === nextProps.stats.attempted &&
    prevProps.stats.todo === nextProps.stats.todo
  );
}

export default React.memo(ProgressStats, arePropsEqual);
