
'use client';

import { JobApplication } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, MapPin, DollarSign } from 'lucide-react';
import StatusBadge from './status-badge';
import { deleteJobApplication } from '@/app/actions/job-application.actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import JobApplicationForm from './job-application-form';

interface JobApplicationCardProps {
    application: JobApplication;
    onApplicationUpdate: () => void;
}

export default function JobApplicationCard({ application, onApplicationUpdate }: JobApplicationCardProps) {
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleDelete = async () => {
        if (!application.id) return;
        const result = await deleteJobApplication(application.id);
        if (result.success) {
            toast({ title: 'Application Deleted' });
            onApplicationUpdate();
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        onApplicationUpdate();
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <CardTitle>{application.jobTitle}</CardTitle>
                        <CardDescription>{application.companyName}</CardDescription>
                    </div>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex-shrink-0">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Job Application</DialogTitle>
                            </DialogHeader>
                            <JobApplicationForm
                                application={application}
                                onSuccess={handleEditSuccess}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="flex justify-between items-center">
                    <StatusBadge status={application.status} />
                    {application.appliedDate && (
                        <p className="text-sm text-gray-500">
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                    {application.location && (
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{application.location}</span>
                        </div>
                    )}
                    {application.salary && (
                        <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{application.salary}</span>
                        </div>
                    )}
                </div>

                {application.notes && (
                    <p className="text-sm bg-gray-800 p-3 rounded-md border border-gray-700 mt-auto">{application.notes}</p>
                )}
            </CardContent>
            <div className="p-6 pt-0">
                {application.url && (
                    <Button variant="outline" size="sm" asChild>
                        <a href={application.url} target="_blank" rel="noopener noreferrer" className="w-full">
                            View Job Posting
                        </a>
                    </Button>
                )}
            </div>
        </Card>
    );
}
