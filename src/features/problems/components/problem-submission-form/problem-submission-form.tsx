/**
 * @fileoverview A client-side form for submitting a new coding problem.
 *
 * This component provides a comprehensive form for users to contribute new coding
 * interview problems. It uses `react-hook-form` for form management, `zod` for
 * validation, and calls a server action to save the data.
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock,Loader2, PlusCircle } from "lucide-react";
import { z } from "zod";

import { addProblem } from "@/app/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn, slugify } from "@/lib/utils";
import type { Company } from "@/types";

import { lastAskedPeriodOptions } from "../../constants";
import type { LeetCodeProblem } from "../../types";
import TagBadge from "../tag-badge/tag-badge";

/**
 * Props for the ProblemSubmissionForm component.
 */
interface ProblemSubmissionFormProps {
  /** A list of companies to populate the company selection dropdown. */
  companies: Company[];
}

/**
 * Zod schema for validating the problem submission form fields.
 */
const problemFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters." })
    .max(150),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  link: z
    .string()
    .url({ message: "Please enter a valid Interview Problem URL." })
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "Must be a valid HTTP or HTTPS URL.",
    }),
  tags: z.string().optional(),
  companyId: z.string(),
  lastAskedPeriod: z.enum(
    [
      "last_30_days",
      "within_3_months",
      "within_6_months",
      "older_than_6_months",
    ] as const,
  ),
});

type ProblemFormValues = z.infer<typeof problemFormSchema>;

const DIFFICULTY_TEXT_COLORS = {
  Easy: "text-emerald-500",
  Medium: "text-amber-500",
  Hard: "text-rose-500",
};

/**
 * Renders a form for users to submit a new coding interview problem.
 *
 * This component handles the full submission workflow:
 * - Displays input fields for all problem details (title, difficulty, link, etc.).
 * - Populates a dropdown with the list of available companies.
 * - Validates user input against the `problemFormSchema`.
 * - Shows a loading state during form submission.
 * - Calls the `addProblem` server action to save the data.
 * - Provides user feedback (success or error) via toasts.
 * - Resets the form upon a successful submission.
 *
 * @param {ProblemSubmissionFormProps} props - The props for the component.
 * @returns {JSX.Element} The rendered problem submission form.
 */
export default function ProblemSubmissionForm({
  companies,
}: ProblemSubmissionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      title: "",
      difficulty: undefined,
      link: "",
      tags: "", // Default to empty string
      companyId: undefined,
      lastAskedPeriod: undefined,
    },
  });

  const titleValue = form.watch("title");
  const titleLength = titleValue ? titleValue.length : 0;

  async function onSubmit(data: ProblemFormValues) {
    setIsSubmitting(true);
    toast({
      title: "Submitting Problem...",
      description: "Please wait while we process your submission.",
    });

    const company = companies.find((c) => c.id === data.companyId);
    if (!company) {
      toast({
        title: "Error",
        description: "Selected company not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const problemData: Omit<LeetCodeProblem, "id"> = {
      title: data.title,
      slug: slugify(data.title),
      normalizedTitle: data.title.toLowerCase(),
      difficulty: data.difficulty,
      link: data.link,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [],
      companyId: data.companyId,
      companySlug: company.slug,
      lastAskedPeriod: data.lastAskedPeriod,
    };

    const result = await addProblem(problemData);

    setIsSubmitting(false);
    if (result.success && result.data) {
      const message = result.data.updated
        ? `"${result.data.problem.title}" already existed and its 'last asked' time has been updated.`
        : `"${result.data.problem.title}" has been added successfully.`;
      toast({
        title: result.data.updated ? "Problem Updated! ?" : "Problem Submitted! ??",
        description: message,
      });
      form.reset();
    } else {
      toast({
        title: "Submission Failed",
        description:
          result.error?.message || "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between items-center">
                <span>
                  Problem Title <span className="text-destructive">*</span>
                </span>
                <span
                  className={cn(
                    "text-xs text-muted-foreground font-normal",
                    titleLength >= 150 && "text-destructive font-medium",
                  )}
                >
                  {titleLength}/150
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Two Sum" {...field} />
              </FormControl>
              <FormDescription>
                The official title of the LeetCode problem.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Difficulty <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Easy">
                      <span className={DIFFICULTY_TEXT_COLORS.Easy}>Easy</span>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <span className={DIFFICULTY_TEXT_COLORS.Medium}>
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="Hard">
                      <span className={DIFFICULTY_TEXT_COLORS.Hard}>Hard</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastAskedPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <CalendarClock
                    size={16}
                    className="mr-1.5 text-muted-foreground"
                  />
                  Last Asked Period <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select when it was last asked" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lastAskedPeriodOptions.map((option) => (
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
        </div>

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                LeetCode Link <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://leetcode.com/problems/..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The direct URL to the problem on LeetCode.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => {
            const tagsList = field.value
              ? field.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0)
              : [];

            return (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Array, Hash Table, Dynamic Programming"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                {tagsList.length > 0 && (
                  <div
                    className="flex flex-wrap gap-2 mt-2 animate-in fade-in zoom-in-95 duration-200"
                    role="status"
                    aria-label="Parsed tags preview"
                  >
                    {tagsList.map((tag, i) => (
                      <TagBadge key={`${tag}-${i}`} tag={tag} />
                    ))}
                  </div>
                )}
                <FormDescription>
                  Comma-separated list of relevant tags. Can be left empty.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Company <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company this problem is often asked by" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      No companies available. Please add companies first.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the company most frequently associated with this problem.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting || companies.length === 0}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit Problem
            </>
          )}
        </Button>
        {companies.length === 0 && (
          <p className="text-sm text-destructive mt-2">
            Cannot submit problem: No companies found in the database. Please
            ensure companies are seeded or added.
          </p>
        )}
      </form>
    </Form>
  );
}






