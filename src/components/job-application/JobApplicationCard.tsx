"use client";

import { JobApplication } from "@/types/job-application";
import {
  updateJobApplication,
  deleteJobApplication,
} from "@/lib/firestore/jobApplications";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import StatusTimelineModal from "./StatusTimelineModal";
import { getLogoUrl } from "@/lib/utils";

interface JobApplicationCardProps {
  application: JobApplication;
  onApplicationDeleted: (id: string) => void;
  onApplicationUpdated: (id: string, updates: Partial<JobApplication>) => void;
}

export default function JobApplicationCard({
  application,
  onApplicationDeleted,
  onApplicationUpdated,
}: JobApplicationCardProps) {

  const handleStatusChange = async (newStatus: JobApplication["status"]) => {
    await updateJobApplication(application.id, { status: newStatus });
    onApplicationUpdated(application.id, { status: newStatus });
  };

  const handleDelete = async () => {
    await deleteJobApplication(application.id);
    onApplicationDeleted(application.id);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                {application.companyLogoUrl && (
                    <Image
                        src={getLogoUrl(application.companyLogoUrl) as string}
                        alt={`${application.companyName} logo`}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                )}
                <div>
                    <h3 className="font-bold text-lg">{application.companyName}</h3>
                    <p className="text-gray-500">{application.position}</p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4" data-testid="more-horizontal" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <StatusTimelineModal application={application}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Timeline</DropdownMenuItem>
                    </StatusTimelineModal>
                    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
            {application.location && <p>{application.location}</p>}
            {application.jobType && <p className="capitalize">{application.jobType.toLowerCase()}</p>}
        </div>
        <Select
            value={application.status}
            onValueChange={(value) =>
                handleStatusChange(value as JobApplication["status"])
            }
            >
            <SelectTrigger className="w-auto">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Saved">Saved</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
        </Select>
      </div>
    </div>
  );
}
