
/**
 * @fileoverview A component for displaying the difficulty of a coding problem.
 *
 * This component renders a colored badge (e.g., green for Easy, yellow for Medium,
 * red for Hard) to visually indicate the difficulty level of a problem.
 */
import type { LeetCodeProblem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * Props for the DifficultyBadge component.
 */
interface DifficultyBadgeProps {
  /** The difficulty level to display ('Easy', 'Medium', or 'Hard'). */
  difficulty: LeetCodeProblem['difficulty'];
  /** Optional additional class names to apply to the badge. */
  className?: string;
}

/**
 * The core component for rendering a difficulty badge.
 *
 * This component applies specific background and text colors to a `Badge`
 * based on the provided difficulty level, ensuring a consistent and
 * accessible visual representation.
 *
 * @param {DifficultyBadgeProps} props - The props for the component.
 * @returns {JSX.Element} The rendered difficulty badge.
 */
const DifficultyBadgeComponent: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  const difficultyStyles = {
    Easy: 'bg-green-500 hover:bg-green-600 text-white',
    Medium: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    Hard: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <Badge
      className={cn(
        'px-2.5 py-1 text-xs font-semibold transition-colors border-transparent',
        difficultyStyles[difficulty],
        className
      )}
    >
      {difficulty}
    </Badge>
  );
};

/**
 * A memoized version of the `DifficultyBadgeComponent` to prevent unnecessary re-renders.
 */
const DifficultyBadge = React.memo(DifficultyBadgeComponent);
export default DifficultyBadge;
