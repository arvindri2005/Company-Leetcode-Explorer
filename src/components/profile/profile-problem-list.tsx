
'use client';

import React from 'react';
import type { LeetCodeProblem, ProblemStatus } from '@/types';
import ProblemCard from '@/components/problem/problem-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface ProblemWithStatusAndBookmark extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

interface ProfileProblemListProps {
  title: string;
  problems: ProblemWithStatusAndBookmark[];
  isLoading: boolean;
  listType: 'bookmarks' | 'status'; // To differentiate handling slightly if needed
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void;
  onProblemStatusChange?: (problemId: string, newStatus: ProblemStatus) => void;
  companySlugForProblemCard?: string; // If all problems belong to one company, for fallback
}

const ProfileProblemList: React.FC<ProfileProblemListProps> = ({
  title,
  problems,
  isLoading,
  onBookmarkChanged,
  onProblemStatusChange,
  companySlugForProblemCard
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (problems.length === 0) {
    return <p className="text-muted-foreground text-center py-6">No problems in this list yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {problems.map(problem => (
        <ProblemCard
          key={problem.id}
          problem={problem}
          companySlug={problem.companySlug || companySlugForProblemCard || 'unknown-company'}
          initialIsBookmarked={problem.isBookmarked}
          onBookmarkChanged={onBookmarkChanged}
          problemStatus={problem.currentStatus || 'none'}
          onProblemStatusChange={onProblemStatusChange}
        />
      ))}
    </div>
  );
};

export default ProfileProblemList;
