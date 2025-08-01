
import { JobApplicationStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
    status: JobApplicationStatus;
}

const statusColors: Record<JobApplicationStatus, string> = {
    Wishlist: 'bg-gray-600 text-gray-100',
    Applied: 'bg-blue-600 text-blue-100',
    Interviewing: 'bg-yellow-600 text-yellow-100',
    Offer: 'bg-green-600 text-green-100',
    Rejected: 'bg-red-600 text-red-100',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <Badge className={`${statusColors[status]} hover:${statusColors[status]}`}>
            {status}
        </Badge>
    );
}
