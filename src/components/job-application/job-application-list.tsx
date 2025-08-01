import { JobApplication } from '@/types';
import JobApplicationCard from './job-application-card';

interface JobApplicationListProps {
    applications: JobApplication[];
    onApplicationUpdate: () => void;
}

export default function JobApplicationList({ applications, onApplicationUpdate }: JobApplicationListProps) {
    if (applications.length === 0) {
        return (
            <div className="text-center text-gray-400 border-2 border-dashed border-gray-700 rounded-lg p-12">
                <h2 className="text-xl font-semibold">No applications found.</h2>
                <p className="mt-2">Try adjusting your filters or add a new application to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
                <JobApplicationCard key={app.id} application={app} onApplicationUpdate={onApplicationUpdate} />
            ))}
        </div>
    );
}