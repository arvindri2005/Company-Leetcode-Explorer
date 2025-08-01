
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobApplication, JobApplicationSchema, JOB_APPLICATION_STATUS_OPTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addJobApplication, updateJobApplication } from '@/app/actions/job-application.actions';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';

const FormSchema = JobApplicationSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true });
type JobApplicationFormValues = z.infer<typeof FormSchema>;

interface JobApplicationFormProps {
    application?: JobApplication;
    onSuccess: () => void;
}

export default function JobApplicationForm({ application, onSuccess }: JobApplicationFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const form = useForm<JobApplicationFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            jobTitle: application?.jobTitle || '',
            location: application?.location || '',
            salary: application?.salary || '',
            status: application?.status || 'Applied',
            appliedDate: application?.appliedDate,
            url: application?.url || '',
            notes: application?.notes || '',
        },
    });

    const onSubmit = async (data: JobApplicationFormValues) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to perform this action.', variant: 'destructive' });
            return;
        }

        const result = application
            ? await updateJobApplication(application.id!, { ...data, userId: user.uid })
            : await addJobApplication({ ...data, userId: user.uid });

        if (result.success) {
            toast({ title: `Application ${application ? 'Updated' : 'Added'}` });
            onSuccess();
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Software Engineer" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tech Corp" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="San Francisco, CA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salary</FormLabel>
                                <FormControl>
                                    <Input placeholder="$120,000 - $150,000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {JOB_APPLICATION_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="appliedDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Applied Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field}
                                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Post URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/job/123" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Recruiter was nice..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Application'}
                </Button>
            </form>
        </Form>
    );
}
