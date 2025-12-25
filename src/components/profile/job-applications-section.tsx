"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JobApplicationList } from "@/components/profile/job-application-list";
import { AddJobApplicationDialog } from "@/components/profile/add-job-application-dialog";
import { useToast } from "@/hooks/use-toast";
import { JobApplication, JobApplicationStatus } from "@/types";
import {
  getUserJobApplicationsAction,
  addJobApplicationAction,
  updateJobApplicationAction,
  deleteJobApplicationAction
} from "@/app/actions/job-application.actions";

interface JobApplicationsSectionProps {
  userId: string;
}

export function JobApplicationsSection({ userId }: JobApplicationsSectionProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchApplications = async () => {
    setIsLoading(true);
    const result = await getUserJobApplicationsAction(userId);
    if (result.success && result.data) {
      setApplications(result.data);
    } else {
      toast({
        title: "Error",
        description: "Failed to load job applications.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchApplications();
    }
  }, [userId]);

  const handleAddApplication = async (data: any) => {
    setIsSubmitting(true);
    const result = await addJobApplicationAction(userId, data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Job application added successfully.",
      });
      setIsDialogOpen(false);
      fetchApplications();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add job application.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (applicationId: string, newStatus: JobApplicationStatus) => {
      // Optimistic update
      const originalApplications = [...applications];
      setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      const result = await updateJobApplicationAction(userId, applicationId, { status: newStatus });

      if (!result.success) {
          setApplications(originalApplications); // Revert on failure
          toast({
              title: "Error",
              description: result.error || "Failed to update status.",
              variant: "destructive"
          });
      }
  };

  const handleDelete = async (applicationId: string) => {
      // Optimistic update
      const originalApplications = [...applications];
      setApplications(prev => prev.filter(app => app.id !== applicationId));

      const result = await deleteJobApplicationAction(userId, applicationId);

      if (!result.success) {
          setApplications(originalApplications); // Revert on failure
           toast({
              title: "Error",
              description: result.error || "Failed to delete application.",
              variant: "destructive"
          });
      } else {
           toast({
              title: "Success",
              description: "Job application deleted.",
          });
      }
  };

  return (
    <>
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Job Applications</CardTitle>
            <CardDescription className="mt-1">
              Track your job search progress and status.
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </CardHeader>
        <CardContent>
          <JobApplicationList
            applications={applications}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <AddJobApplicationDialog
        userId={userId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddApplication}
        onSuccess={() => {}}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
