import { z } from "zod";

// --- Types for Job Application Tracking ---
/**
 * @description Zod schema for the status of a job application.
 */
export const JobApplicationStatusSchema = z.enum([
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Wishlist",
]);
/**
 * @description Represents the status of a job application.
 */
export type JobApplicationStatus = z.infer<typeof JobApplicationStatusSchema>;

/**
 * @description Zod schema for a job application.
 */
export const JobApplicationSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  userId: z.string(),
  companyName: z.string().min(1, "Company name is required."),
  jobTitle: z.string().min(1, "Job title is required."),
  location: z.string().optional(),
  salary: z.string().optional(),
  status: JobApplicationStatusSchema,
  appliedDate: z.date().optional(),
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * @description Represents a job application.
 */
export type JobApplication = z.infer<typeof JobApplicationSchema>;

/**
 * @description Options for selecting the job application status in UI elements.
 */
export const JOB_APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
  value: JobApplicationStatus;
  label: string;
}> = [
  { value: "Wishlist", label: "Wishlist" },
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
  { value: "Rejected", label: "Rejected" },
] as const;






