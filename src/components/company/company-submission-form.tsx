
'use client';

import type { Company } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addCompany as addCompanyAction } from '@/app/actions';
import { useState } from 'react';
import { Loader2, PlusCircle, Link as LinkIcon } from 'lucide-react';

const companyFormSchema = z.object({
  name: z.string().min(2, { message: 'Company name must be at least 2 characters.' }).max(100),
  logo: z.string().url({ message: 'Please enter a valid URL for the logo.' }).optional().or(z.literal('')),
  description: z.string().max(500, { message: 'Description cannot exceed 500 characters.' }).optional().or(z.literal('')),
  website: z.string().url({ message: 'Please enter a valid URL for the website.' }).optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanySubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      logo: '',
      description: '',
      website: '',
    },
  });

  async function onSubmit(data: CompanyFormValues) {
    setIsSubmitting(true);
    toast({
      title: 'Submitting Company...',
      description: 'Please wait while we add the company.',
    });

    const companyData: Omit<Company, 'id'> = {
      name: data.name,
      logo: data.logo === '' ? undefined : data.logo,
      description: data.description === '' ? undefined : data.description,
      website: data.website === '' ? undefined : data.website,
    };

    const result = await addCompanyAction(companyData);

    setIsSubmitting(false);
    if (result.success && result.data) {
      toast({
        title: 'Company Added! 🎉',
        description: `"${result.data.name}" has been added successfully.`,
      });
      form.reset();
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error || 'An unknown error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Awesome Tech Inc." {...field} />
              </FormControl>
              <FormDescription>The official name of the company.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormDescription>A direct URL to the company's logo. Leave blank if not available.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Specializes in cutting-edge AI solutions."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>A short description of the company or what they are known for in interviews.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Website URL (Optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormDescription>The official website of the company. Leave blank if not available.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Company...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Company
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
