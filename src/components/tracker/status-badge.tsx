import { Badge } from "@/components/ui/badge";
import { JobApplicationStatus } from "@/types/job-application";

interface StatusBadgeProps {
  status: JobApplicationStatus;
}

const statusColors: Record<JobApplicationStatus, string> = {
  Wishlist: "bg-gray-500 text-white",
  Applied: "bg-blue-500 text-white",
  Interviewing: "bg-purple-500 text-white",
  Offer: "bg-green-500 text-white",
  Rejected: "bg-red-500 text-white",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={`${statusColors[status] || "bg-gray-500"} hover:bg-opacity-90`}>
      {status}
    </Badge>
  );
}
