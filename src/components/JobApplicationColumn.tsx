import { JobApplication } from "@/types/job-application";
import JobApplicationCard from "./JobApplicationCard";

interface JobApplicationColumnProps {
  status: JobApplication["status"];
  applications: JobApplication[];
  onApplicationDeleted: (id: string) => void;
  onApplicationUpdated: (id: string, updates: Partial<JobApplication>) => void;
}

export default function JobApplicationColumn({
  status,
  applications,
  onApplicationDeleted,
  onApplicationUpdated,
}: JobApplicationColumnProps) {
  return (
    <div className="bg-gray-100/60 dark:bg-gray-800/60 rounded-lg p-4 flex-shrink-0 w-80">
      <h2 className="font-bold mb-4 text-lg capitalize">{status}</h2>
      <div className="space-y-4">
        {applications.map((app) => (
          <JobApplicationCard
            key={app.id}
            application={app}
            onApplicationDeleted={onApplicationDeleted}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
}
