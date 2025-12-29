"use client";

import { useEffect, useState, useMemo } from "react";
import { JobApplication } from "@/types/job-application";
import { jobApplicationService } from "@/services/job-application.service";
import { useAuth } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, ExternalLink, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { JobApplicationDialog } from "./job-application-dialog";
import { StatusBadge } from "./status-badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

export function JobApplicationList() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | undefined>(undefined);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await jobApplicationService.listApplications(user.uid);
      setApplications(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
        setLoading(false);
        return;
    }
    if (user) {
        fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this application?")) return;
    try {
      await jobApplicationService.deleteApplication(user.uid, id);
      toast({ title: "Deleted", description: "Application removed." });
      fetchApplications();
    } catch (error) {
      toast({ title: "Error", variant: "destructive", description: "Could not delete." });
    }
  };

  const handleEdit = (app: JobApplication) => {
    setEditingApplication(app);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingApplication(undefined);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job Applications</h2>
          <p className="text-muted-foreground">
            Track and manage your job search progress.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Application
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50/5 border-dashed border-gray-300 dark:border-gray-700">
          <h3 className="text-lg font-medium">No applications yet</h3>
          <p className="text-gray-500 mb-4">Start tracking your dream jobs today.</p>
          <Button onClick={handleCreate} variant="outline">
            Add your first application
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {applications.map((app) => (
              <Card key={app.id || Math.random()}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                      <CardDescription>{app.companyName}</CardDescription>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm space-y-1">
                   {app.location && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-3 h-3" /> {app.location}
                    </div>
                   )}
                   {app.salary && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <DollarSign className="w-3 h-3" /> {app.salary}
                    </div>
                   )}
                   <div className="text-xs text-gray-400 mt-2">
                    Updated {format(app.updatedAt || new Date(), "MMM d, yyyy")}
                   </div>
                </CardContent>
                <CardFooter className="justify-end gap-2 pt-2">
                    {app.url && (
                        <Button size="sm" variant="ghost" asChild>
                            <Link href={app.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(app)}>
                        Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => app.id && handleDelete(app.id)}>
                        Delete
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id || Math.random()}>
                    <TableCell className="font-medium">
                        {app.companyName}
                        {app.url && (
                            <Link href={app.url} target="_blank" className="ml-2 inline-block align-middle text-gray-400 hover:text-teal-400">
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        )}
                    </TableCell>
                    <TableCell>{app.jobTitle}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>{app.location || "-"}</TableCell>
                    <TableCell>
                      {format(app.updatedAt || new Date(), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(app)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => app.id && handleDelete(app.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <JobApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={editingApplication}
        onSuccess={fetchApplications}
      />
    </div>
  );
}
