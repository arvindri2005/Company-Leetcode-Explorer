/**
 * @description Represents the target role level for company-specific strategy generation.
 */
export type TargetRoleLevel =
  | "internship"
  | "new_grad"
  | "experienced"
  | "general";

/**
 * @description Options for selecting the target role level in UI elements.
 */
export const targetRoleLevelOptions: ReadonlyArray<{
  value: TargetRoleLevel;
  label: string;
}> = [
  { value: "general", label: "General Advice" },
  { value: "internship", label: "Internship" },
  { value: "new_grad", label: "New Grad" },
  { value: "experienced", label: "Experienced Professional" },
] as const;

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
