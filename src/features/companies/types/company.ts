import { z } from "zod";

import { SlugSchema } from "@/types/common";

/**
 * @description Represents a company entity in the application.
 */
export interface Company {
  id: string;
  name: string;
  normalizedName?: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  problemCount?: number; // Denormalized count of problems
  // Denormalized problem statistics
  difficultyCounts?: { Easy: number; Medium: number; Hard: number };
  recencyCounts?: {
    last_30_days: number;
    within_3_months: number;
    within_6_months: number;
    older_than_6_months: number;
  };
  commonTags?: Array<{ tag: string; count: number }>;
  relatedCompanies?: string[]; // List of related company names
  statsLastUpdatedAt?: Date; // Timestamp of when these stats were last updated
}

/**
 * @description Zod schema for a Company.
 * @see Company
 */
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  normalizedName: z.string().optional(),
  slug: SlugSchema,
  logo: z
    .string()
    .max(2048, "Logo URL is too long")
    .refine(
      (url) =>
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/"),
      {
        message: "Logo must be a valid URL (http/https) or relative path",
      }
    )
    .optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  website: z
    .string()
    .max(2048, "Website URL is too long")
    .url()
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      {
        message: "Website must start with http:// or https://",
      }
    )
    .optional()
    .or(z.literal("")),
  problemCount: z.number().optional(),
  difficultyCounts: z
    .object({
      Easy: z.number(),
      Medium: z.number(),
      Hard: z.number(),
    })
    .optional(),
  recencyCounts: z
    .object({
      last_30_days: z.number(),
      within_3_months: z.number(),
      within_6_months: z.number(),
      older_than_6_months: z.number(),
    })
    .optional(),
  commonTags: z
    .array(
      z.object({
        tag: z.string(),
        count: z.number(),
      })
    )
    .optional(),
  relatedCompanies: z.array(z.string().max(100)).max(20, "Cannot have more than 20 related companies").optional(),
  statsLastUpdatedAt: z.date().optional(),
});






