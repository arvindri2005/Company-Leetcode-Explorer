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
    <Card className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl mb-8 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-brand-purple/5 transition-all duration-500 overflow-hidden group">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-teal/20 to-brand-purple/20 rounded-lg">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Your Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
        <div className="p-4 sm:p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 cursor-pointer group/stat">
          <div className="p-2 bg-green-500/10 rounded-lg w-fit mx-auto mb-3 group-hover/stat:bg-green-500/20 transition-colors">
            <CheckCircle2
              className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 group-hover/stat:scale-110 transition-transform"
              aria-hidden="true"
            />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-green-500 mb-1">{stats.solved}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Solved</p>
        </div>
        <div className="p-4 sm:p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 cursor-pointer group/stat">
          <div className="p-2 bg-yellow-500/10 rounded-lg w-fit mx-auto mb-3 group-hover/stat:bg-yellow-500/20 transition-colors">
            <Pencil
              className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500 group-hover/stat:scale-110 transition-transform"
              aria-hidden="true"
            />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-1">{stats.attempted}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Attempted</p>
        </div>
        <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 cursor-pointer group/stat">
          <div className="p-2 bg-blue-500/10 rounded-lg w-fit mx-auto mb-3 group-hover/stat:bg-blue-500/20 transition-colors">
            <ListTodo
              className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 group-hover/stat:scale-110 transition-transform"
              aria-hidden="true"
            />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-blue-500 mb-1">{stats.todo}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">To-Do</p>
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
