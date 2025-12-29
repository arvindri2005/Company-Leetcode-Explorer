import { JobApplicationList } from "@/components/tracker/job-application-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Application Tracker | Byte To Offer",
  description: "Track your job applications, interviews, and offers in one place.",
};

export default function TrackerPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">
      <JobApplicationList />
    </div>
  );
}
