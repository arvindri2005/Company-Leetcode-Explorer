import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  tag: string;
  className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({ tag, className }) => {
  return (
    <Badge
      variant="secondary"
      className={cn('px-2 py-0.5 text-xs', className)}
    >
      {tag}
    </Badge>
  );
};

export default TagBadge;
