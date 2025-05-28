
'use client';

import type { LeetCodeProblem, LastAskedPeriod, ProblemStatus } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import ProblemCard from './problem-card';
import ProblemListControls, { DifficultyFilter, SortKey, LastAskedFilter, StatusFilter } from './problem-list-controls';
import { useAuth } from '@/contexts/auth-context';
import { getUsersBookmarkedProblemIdsAction, getAllUserProblemStatusesAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';

interface ProblemListProps {
  problems: LeetCodeProblem[];
}

const ProblemList: React.FC<ProblemListProps> = ({ problems: initialProblems }) => {
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [lastAskedFilter, setLastAskedFilter] = useState<LastAskedFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { user } = useAuth();
  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [problemStatuses, setProblemStatuses] = useState<Record<string, ProblemStatus>>({});
  const [isLoadingUserSpecificData, setIsLoadingUserSpecificData] = useState(false);

  useEffect(() => {
    const fetchUserSpecificData = async () => {
      if (user?.uid) {
        setIsLoadingUserSpecificData(true);
        const [bookmarkResult, statusResult] = await Promise.all([
          getUsersBookmarkedProblemIdsAction(user.uid),
          getAllUserProblemStatusesAction(user.uid)
        ]);

        if (Array.isArray(bookmarkResult)) {
          setBookmarkedProblemIds(new Set(bookmarkResult));
        } else {
          console.error("Error fetching bookmarks:", bookmarkResult.error);
          setBookmarkedProblemIds(new Set());
        }

        if (typeof statusResult === 'object' && statusResult !== null && !('error' in statusResult)) {
          setProblemStatuses(statusResult);
        } else {
          console.error("Error fetching problem statuses:", (statusResult as {error: string}).error);
          setProblemStatuses({});
        }
        setIsLoadingUserSpecificData(false);
      } else {
        setBookmarkedProblemIds(new Set());
        setProblemStatuses({});
        setIsLoadingUserSpecificData(false);
      }
    };
    fetchUserSpecificData();
  }, [user]);

  const handleProblemBookmarkChange = (problemId: string, newStatus: boolean) => {
    setBookmarkedProblemIds(prevIds => {
      const newSet = new Set(prevIds);
      if (newStatus) newSet.add(problemId);
      else newSet.delete(problemId);
      return newSet;
    });
  };

  const handleProblemStatusChange = (problemId: string, newStatus: ProblemStatus) => {
    setProblemStatuses(prevStatuses => ({
      ...prevStatuses,
      [problemId]: newStatus === 'none' ? undefined : newStatus, // Remove if 'none', else update/add
    }));
  };

  const difficultyOrder: Record<LeetCodeProblem['difficulty'], number> = { Easy: 1, Medium: 2, Hard: 3 };
  const lastAskedOrder: Record<LastAskedPeriod, number> = {
    'last_30_days': 1, 'within_3_months': 2, 'within_6_months': 3, 'older_than_6_months': 4,
  };
  
  const filteredAndSortedProblems = useMemo(() => {
    let processedProblems = [...initialProblems];

    if (difficultyFilter !== 'all') {
      processedProblems = processedProblems.filter(p => p.difficulty === difficultyFilter);
    }
    if (lastAskedFilter !== 'all') {
      processedProblems = processedProblems.filter(p => p.lastAskedPeriod === lastAskedFilter);
    }
    if (statusFilter !== 'all') {
      processedProblems = processedProblems.filter(p => {
        const currentStatus = problemStatuses[p.id] || 'none';
        return currentStatus === statusFilter;
      });
    }
    if (searchTerm.trim() !== '') {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      processedProblems = processedProblems.filter(p => 
        p.title.toLowerCase().includes(lowercasedSearchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowercasedSearchTerm))
      );
    }

    processedProblems.sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title);
      if (sortKey === 'difficulty') return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      if (sortKey === 'lastAsked') {
        const aPeriod = a.lastAskedPeriod ? lastAskedOrder[a.lastAskedPeriod] : Number.MAX_SAFE_INTEGER;
        const bPeriod = b.lastAskedPeriod ? lastAskedOrder[b.lastAskedPeriod] : Number.MAX_SAFE_INTEGER;
        return aPeriod - bPeriod;
      }
      return 0;
    });
    return processedProblems;
  }, [initialProblems, difficultyFilter, sortKey, lastAskedFilter, statusFilter, searchTerm, problemStatuses, difficultyOrder, lastAskedOrder]);

  if (initialProblems.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No problems found for this company.</p>;
  }
  
  return (
    <div>
      <ProblemListControls
        difficultyFilter={difficultyFilter}
        onDifficultyFilterChange={setDifficultyFilter}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        lastAskedFilter={lastAskedFilter}
        onLastAskedFilterChange={setLastAskedFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        problemCount={filteredAndSortedProblems.length}
        showStatusFilter={!!user} // Only show status filter if user is logged in
      />
      {isLoadingUserSpecificData && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading user data...</p>
        </div>
      )}
      {!isLoadingUserSpecificData && filteredAndSortedProblems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProblems.map(problem => (
            <ProblemCard 
              key={problem.id} 
              problem={problem}
              initialIsBookmarked={bookmarkedProblemIds.has(problem.id)}
              onBookmarkChanged={handleProblemBookmarkChange}
              problemStatus={problemStatuses[problem.id] || 'none'}
              onProblemStatusChange={handleProblemStatusChange}
            />
          ))}
        </div>
      ) : (
         !isLoadingUserSpecificData && (
            <p className="text-center text-muted-foreground py-10">
                No problems match the current filters or search term.
            </p>
         )
      )}
    </div>
  );
};

export default ProblemList;
