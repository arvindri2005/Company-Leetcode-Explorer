/**
 * @fileoverview A simple component for displaying a tag associated with a problem.
 *
 * This component renders a styled badge, typically used to display keywords or
 * topics related to a coding problem (e.g., "Array", "Hash Table").
 */
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Props for the TagBadge component.
 */
interface TagBadgeProps {
  /** The text content of the tag. */
  tag: string;
  /** Optional additional class names to apply to the badge. */
  className?: string;
}

/**
 * The core component for rendering a tag badge.
 *
 * @param {TagBadgeProps} props - The props for the component.
 * @returns {JSX.Element} The rendered tag badge.
 */
const TagBadgeComponent: React.FC<TagBadgeProps> = ({ tag, className }) => {
  return (
    <Badge variant="secondary" className={cn("px-2 py-0.5 text-xs", className)}>
      {tag}
    </Badge>
  );
};

/**
 * A memoized version of the `TagBadgeComponent` to optimize performance.
 */
const TagBadge = React.memo(TagBadgeComponent);
export default TagBadge;






