"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { JobApplication } from "@/types/job-application";
import { getJobApplications } from "@/lib/firestore/jobApplications";
import JobApplicationColumn from "@/components/JobApplicationColumn";
import { Button } from "@/components/ui/button";

const STATUSES: JobApplication["status"][] = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      getJobApplications(user.uid)
        .then((apps) => {
          setApplications(apps);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching job applications:", error);
          setLoading(false);
        });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleApplicationDeleted = (id: string) => {
    setApplications(applications.filter((app) => app.id !== id));
  };

  const handleApplicationUpdated = (
    id: string,
    updates: Partial<JobApplication>
  ) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      )
    );
  };

  const groupedApplications = STATUSES.reduce((acc, status) => {
    acc[status] = applications.filter((app) => app.status === status);
    return acc;
  }, {} as Record<JobApplication["status"], JobApplication[]>);

  if (loading || authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">
          Please log in to track your job applications.
        </h1>
        <p className="mb-8">
          This feature is only available to logged-in users.
        </p>
        <Link href="/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-gray-500">Keep track of your applied job all in one place</p>
        </div>
        <Link href="/add-application">
          <Button>Add Job</Button>
        </Link>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <JobApplicationColumn
            key={status}
            status={status}
            applications={groupedApplications[status]}
            onApplicationDeleted={handleApplicationDeleted}
            onApplicationUpdated={handleApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
}
