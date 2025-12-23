import { z } from "zod";

// --- Enums ---

export const LastAskedPeriodSchema = z.enum([
  "last_30_days",
  "within_3_months",
  "within_6_months",
  "older_than_6_months",
]);

export const ProblemStatusSchema = z.enum([
  "solved",
  "attempted",
  "todo",
  "none",
]);

// --- Company Schema ---

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  normalizedName: z.string().optional(),
  slug: z.string(),
  logo: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  problemCount: z.number().optional().default(0),
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
  relatedCompanies: z.array(z.string()).optional(),
  statsLastUpdatedAt: z.date().optional(), // In Firestore this might be a Timestamp, need to handle conversion before parsing if coming from raw SDK data, but repository converts it.
});

// --- LeetCodeProblem Schema ---

const CompanySpecificDataSchema = z.object({
  lastAskedPeriod: LastAskedPeriodSchema.optional(),
});

export const LeetCodeProblemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  link: z.string().optional().or(z.literal("")), // Validation for URL could be added, but existing data might be partial
  tags: z.array(z.string()),
  companyId: z.string(),
  companySlug: z.string(),
  companyIds: z.array(z.string()).optional(),
  companies: z.record(z.string(), CompanySpecificDataSchema).optional(),
  problemCompanyName: z.string().optional(),
  slug: z.string(),
  lastAskedPeriod: LastAskedPeriodSchema.optional(),
  normalizedTitle: z.string(),
  isBookmarked: z.boolean().optional(),
  currentStatus: ProblemStatusSchema.optional(),
  acceptanceRate: z.number().optional(),
});
