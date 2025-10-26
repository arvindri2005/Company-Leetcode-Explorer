"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { JobApplication } from "@/types/job-application";
import { getJobApplications } from "@/lib/firestore/jobApplications";
import JobApplicationColumn from "@/components/JobApplicationColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: JobApplication["status"][] = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

const JOB_TYPES: JobApplication["jobType"][] = [
  "FULL TIME",
  "PART TIME",
  "REMOTE",
  "CONTRACT",
];

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("All");

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

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const searchTermLower = searchTerm.toLowerCase();
      const companyMatch = app.companyName.toLowerCase().includes(searchTermLower);
      const positionMatch = app.position.toLowerCase().includes(searchTermLower);
      const statusMatch =
        statusFilter === "All" || app.status === statusFilter;
      const jobTypeMatch =
        jobTypeFilter === "All" || app.jobType === jobTypeFilter;
      return (companyMatch || positionMatch) && statusMatch && jobTypeMatch;
    });
  }, [applications, searchTerm, statusFilter, jobTypeFilter]);

  const groupedApplications = STATUSES.reduce((acc, status) => {
    acc[status] = filteredApplications.filter((app) => app.status === status);
    return acc;
  }, {} as Record<JobApplication["status"], JobApplication[]>);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
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
          <p className="text-gray-500">
            Keep track of your applied job all in one place
          </p>
        </div>
        <Link href="/add-application">
          <Button>Add Job</Button>
        </Link>
      </div>
      <div className="flex items-center space-x-4 mb-8">
        <Input
          placeholder="Search by company or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Job Types</SelectItem>
            {JOB_TYPES.map((jobType) => (
              <SelectItem key={jobType} value={jobType}>
                {jobType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
