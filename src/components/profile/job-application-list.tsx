"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  MapPin,
  DollarSign,
  ExternalLink,
  CalendarDays,
  Briefcase
} from "lucide-react";
import { JobApplication, JobApplicationStatus } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_APPLICATION_STATUS_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

interface JobApplicationListProps {
  applications: JobApplication[];
  isLoading: boolean;
  onStatusChange: (applicationId: string, newStatus: JobApplicationStatus) => Promise<void>;
  onDelete: (applicationId: string) => Promise<void>;
  onEdit?: (application: JobApplication) => void; // Future: Enable full editing
}

const statusColorMap: Record<JobApplicationStatus, string> = {
  Wishlist: "bg-slate-500",
  Applied: "bg-blue-500",
  Interviewing: "bg-purple-500",
  Offer: "bg-green-500",
  Rejected: "bg-red-500",
};

export function JobApplicationList({
  applications,
  isLoading,
  onStatusChange,
  onDelete,
  onEdit,
}: JobApplicationListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    if (!id) return;
    setUpdatingId(id);
    await onStatusChange(id, status as JobApplicationStatus);
    setUpdatingId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
        <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No applications yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          Start tracking your job search by adding your first application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company & Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Applied</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{app.companyName}</span>
                    <span className="text-sm text-muted-foreground">
                      {app.jobTitle}
                    </span>
                    {app.url && (
                        <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center mt-1 w-fit"
                        >
                            View Job <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-white hover:bg-opacity-90 transition-colors",
                      statusColorMap[app.status] || "bg-gray-500"
                    )}
                  >
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                   {app.appliedDate ? (
                       <div className="flex items-center">
                           <CalendarDays className="h-3.5 w-3.5 mr-2 opacity-70" />
                           {format(app.appliedDate, "MMM d, yyyy")}
                       </div>
                   ) : (
                       "—"
                   )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {app.location ? (
                        <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-2 opacity-70" />
                            {app.location}
                        </div>
                    ) : null}
                    {app.salary ? (
                        <div className="flex items-center mt-1">
                            <DollarSign className="h-3.5 w-3.5 mr-2 opacity-70" />
                            {app.salary}
                        </div>
                    ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={updatingId === app.id}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={app.status} onValueChange={(val) => handleStatusChange(app.id!, val)}>
                                {JOB_APPLICATION_STATUS_OPTIONS.map((status) => (
                                    <DropdownMenuRadioItem key={status.value} value={status.value}>
                                        {status.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => app.id && onDelete(app.id)}
                      >
                        Delete Application
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
