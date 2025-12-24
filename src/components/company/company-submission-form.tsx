/**
 * @fileoverview A client-side form for submitting a new company to the database.
 *
 * This component provides a complete form with fields for a company's name,
 * logo URL, description, and website. It uses `react-hook-form` for form
 * state management and `zod` for validation. Upon submission, it calls a
 * server action to add the company and provides user feedback via toasts.
 */
"use client";

import type { Company } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addCompany as addCompanyAction } from "@/app/actions";
import { useState } from "react";
import { slugify } from "@/lib/utils";
import { Loader2, PlusCircle, Link as LinkIcon } from "lucide-react";

/**
 * Zod schema for validating the company submission form fields.
 */
const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." })
    .max(100),
  logo: z
    .string()
    .url({ message: "Please enter a valid URL for the logo." })
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters." })
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url({ message: "Please enter a valid URL for the website." })
    .optional()
    .or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

/**
 * Renders a form for users to submit information about a new company.
 *
 * This component handles the entire submission process:
 * - Displays input fields for the company's name, logo, description, and website.
 * - Enforces validation rules, such as minimum name length and valid URLs for optional fields.
 * - Shows a loading state on the submit button during the submission process.
 * - Calls the `addCompanyAction` server action with the form data.
 * - Displays success or error notifications (toasts) to the user.
 * - Resets the form upon successful submission.
 *
 * @returns {JSX.Element} The rendered company submission form.
 */
export default function CompanySubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      description: "",
      website: "",
    },
  });

  async function onSubmit(data: CompanyFormValues) {
    setIsSubmitting(true);
    toast({
      title: "Submitting Company...",
      description: "Please wait while we add the company.",
    });

    const companyData: Omit<Company, "id"> = {
      name: data.name,
      slug: slugify(data.name),
      normalizedName: data.name.toLowerCase(),
      logo: data.logo === "" ? undefined : data.logo,
      description: data.description === "" ? undefined : data.description,
      website: data.website === "" ? undefined : data.website,
    };

    const result = await addCompanyAction(companyData);

    setIsSubmitting(false);
    if (result.success && result.data) {
      toast({
        title: "Company Added! 🎉",
        description: `"${result.data.name}" has been added successfully.`,
      });
      form.reset();
    } else {
      toast({
        title: "Submission Failed",
        description:
          result.error || "An unknown error occurred. Please try again.",
        variant: "destructive",
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
              <FormDescription>
                The official name of the company.
              </FormDescription>
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
              <FormDescription>
                A direct URL to the company&apos;s logo. Leave blank if not
                available.
              </FormDescription>
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
              <FormDescription>
                A short description of the company or what they are known for in
                interviews.
              </FormDescription>
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
              <FormDescription>
                The official website of the company. Leave blank if not
                available.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
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
