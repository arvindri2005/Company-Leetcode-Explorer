
import type { LeetCodeProblem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import React from 'react';

interface DifficultyBadgeProps {
  difficulty: LeetCodeProblem['difficulty'];
  className?: string;
}

const DifficultyBadgeComponent: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  const difficultyStyles = {
    Easy: 'bg-green-500 hover:bg-green-600 text-white',
    Medium: 'bg-yellow-500 hover:bg-yellow-600 text-black', // Yellow usually needs black text for contrast
    Hard: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <Badge
      // We remove variant="default" or other specific variants if we are fully overriding bg and text colors
      className={cn(
        'px-2.5 py-1 text-xs font-semibold transition-colors border-transparent', // Added border-transparent to avoid default border color clashing
        difficultyStyles[difficulty],
        className
      )}
    >
      {difficulty}
    </Badge>
  );
};

const DifficultyBadge = React.memo(DifficultyBadgeComponent);
export default DifficultyBadge;
