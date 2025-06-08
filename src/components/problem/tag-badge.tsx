
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import React from 'react';

interface TagBadgeProps {
  tag: string;
  className?: string;
}

const TagBadgeComponent: React.FC<TagBadgeProps> = ({ tag, className }) => {
  return (
    <Badge
      variant="secondary"
      className={cn('px-2 py-0.5 text-xs', className)}
    >
      {tag}
    </Badge>
  );
};

const TagBadge = React.memo(TagBadgeComponent);
export default TagBadge;
