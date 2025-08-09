'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getJobApplications } from '@/lib/db/job-applications';
import { JobApplication, JobApplicationStatus, JOB_APPLICATION_STATUS_OPTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import JobApplicationList from '@/components/job-application/job-application-list';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import JobApplicationForm from '@/components/job-application/job-application-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatusBadge from '@/components/job-application/status-badge';
import type { Metadata } from 'next';

type SortKey = 'appliedDate-desc' | 'appliedDate-asc' | 'companyName-asc' | 'companyName-desc';



export default function JobApplicationsPage() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | 'all'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('appliedDate-desc');

    const fetchApplications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const apps = await getJobApplications(user.uid);
        setApplications(apps);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        };
        if (!user) {
            setLoading(false);
            return;
        }
        fetchApplications();
    }, [user, authLoading, fetchApplications]);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        fetchApplications();
    };

    const stats = useMemo(() => {
        const counts = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<JobApplicationStatus, number>);
        return {
            total: applications.length,
            ...counts,
        };
    }, [applications]);

    const filteredAndSortedApplications = useMemo(() => {
        let filtered = [...applications];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        return filtered.sort((a, b) => {
            switch (sortKey) {
                case 'appliedDate-desc':
                    return (b.appliedDate?.getTime() || 0) - (a.appliedDate?.getTime() || 0);
                case 'appliedDate-asc':
                    return (a.appliedDate?.getTime() || 0) - (b.appliedDate?.getTime() || 0);
                case 'companyName-asc':
                    return a.companyName.localeCompare(b.companyName);
                case 'companyName-desc':
                    return b.companyName.localeCompare(a.companyName);
                default:
                    return 0;
            }
        });
    }, [applications, statusFilter, sortKey]);

    if (authLoading || loading) {
        return (
            <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 20rem)'}}>
                <Card className="w-full max-w-md text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
                        <CardDescription className="mt-2">
                            Please log in to manage and track your job applications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="mt-4">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">My Job Applications</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Application
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add a New Job Application</DialogTitle>
                            <DialogDescription>
                                Fill in the details of the job you applied for.
                            </DialogDescription>
                        </DialogHeader>
                        <JobApplicationForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        <div className="text-center p-4 rounded-lg bg-gray-800">
                            <p className="text-2xl font-bold">{stats.total || 0}</p>
                            <p className="text-sm font-medium text-gray-400">Total</p>
                        </div>
                        {JOB_APPLICATION_STATUS_OPTIONS.map(status => (
                            <div key={status.value} className="text-center p-4 rounded-lg bg-gray-800">
                                <p className="text-2xl font-bold">{stats[status.value] || 0}</p>
                                <StatusBadge status={status.value} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4 justify-between">
                <div className="flex gap-4">
                    <div>
                        <label htmlFor="status-filter" className="text-sm font-medium">Filter by Status</label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                            <SelectTrigger id="status-filter" className="w-40">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {JOB_APPLICATION_STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <label htmlFor="sort-key" className="text-sm font-medium">Sort by</label>
                    <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                        <SelectTrigger id="sort-key" className="w-48">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="appliedDate-desc">Date Applied (Newest)</SelectItem>
                            <SelectItem value="appliedDate-asc">Date Applied (Oldest)</SelectItem>
                            <SelectItem value="companyName-asc">Company (A-Z)</SelectItem>
                            <SelectItem value="companyName-desc">Company (Z-A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <JobApplicationList applications={filteredAndSortedApplications} onApplicationUpdate={fetchApplications} />
        </div>
    );
}
