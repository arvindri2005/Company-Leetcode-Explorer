import { z } from "zod";

import type { UserProblemStatus } from "@/core/domain/value-objects/user-problem-status.vo"; 

import { Entity } from "./base.entity";

// --- User Authentication and Profile Types (from src/types/user.ts) ---

/**
 * @description Zod schema for UserProfile.
 */
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  createdAt: z.date(),
  lastSyncedAt: z.date().optional(),
});

/**
 * @description Represents a user's profile information stored in Firestore.
 */
export type UserProfile = z.infer<typeof UserProfileSchema>;

// --- User Experience Types (from src/types/user.ts) ---

/**
 * @description Zod schema for validating education experience data.
 */
export const EducationExperienceSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  degree: z.string().min(2, "Degree is required.").max(100, "Degree must be less than 100 characters."),
  fieldOfStudy: z.string().min(2, "Field of study/Major is required.").max(100, "Major must be less than 100 characters."), // was major
  school: z.string().min(2, "School name is required.").max(100, "School name must be less than 100 characters."),
  startDate: z
    .string()
    .min(4, "Start date is required.")
    .regex(
      /^(\d{4}|(0[1-9]|1[0-2])\/\d{4})$/,
      "Start date must be in YYYY or MM/YYYY format."
    ),
  endDate: z.union([
    z.literal(""),
    z.literal("Present"),
    z.string().regex(/^(\d{4}|(0[1-9]|1[0-2])\/\d{4})$/, "End date must be 'Present', YYYY, or MM/YYYY.")
  ]).optional(),
  grade: z.string()
    .max(20, "Grade must be short.")
    .optional()
    .or(z.literal("")), // was gpa
  description: z.string().max(2000).optional().or(z.literal("")),
});
/**
 * @description Represents a user's educational experience.
 */
export type EducationExperience = z.infer<typeof EducationExperienceSchema>;

/**
 * Helper to parse date strings (YYYY or MM/YYYY) into a comparable numerical value (months).
 * YYYY is treated as Jan (start) or Dec (end) of that year.
 */
const parseDateValue = (dateStr: string, isEndDate: boolean): number => {
  // If we can't parse it (should rely on regex first), return safe fallback
  if (!dateStr) {return 0;}
  
  const parts = dateStr.split("/");
  if (parts.length === 2) {
    const [month, year] = parts;
    return parseInt(year, 10) * 12 + parseInt(month, 10);
  } else if (parts.length === 1) {
    const year = parts[0];
    // If just Year:
    // Start date: assume start of year (Month 1)
    // End date: assume end of year (Month 12)
    return parseInt(year, 10) * 12 + (isEndDate ? 12 : 1);
  }
  return 0;
};

/**
 * @description Zod schema for validating work experience data.
 */
export const WorkExperienceBaseSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  role: z.string().min(2, "Job title/Role is required.").max(100, "Role must be less than 100 characters."),
  company: z.string().min(2, "Company name is required.").max(100, "Company name must be less than 100 characters."),
  startDate: z
    .string()
    .min(4, "Start date is required.")
    .regex(
      /^(\d{4}|(0[1-9]|1[0-2])\/\d{4})$/,
      "Start date must be in YYYY or MM/YYYY format."
    ),
  endDate: z.union([
    z.literal(""),
    z.literal("Present"),
    z.string().regex(/^(\d{4}|(0[1-9]|1[0-2])\/\d{4})$/, "End date must be 'Present', YYYY, or MM/YYYY.")
  ]).optional(),
  description: z
    .string()
    .min(10, "Please describe some responsibilities.")
    .max(2000, "Description must be less than 2000 characters.")
    .optional()
    .or(z.literal("")),
  technologies: z.array(z.string()).optional().default([]),
});

export const validateWorkExperienceDates = (data: z.infer<typeof WorkExperienceBaseSchema>) => {
  if (!data.endDate || data.endDate === "Present" || data.endDate === "") {
    return true;
  }
  
  const startVal = parseDateValue(data.startDate, false);
  const endVal = parseDateValue(data.endDate, true);
  
  return startVal <= endVal;
};

export const WorkExperienceSchema = WorkExperienceBaseSchema.refine(validateWorkExperienceDates, {
  message: "End date must be after start date.",
  path: ["endDate"],
});
/**
 * @description Represents a user's work experience.
 */
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

/**
 * @description Information stored for each bookmarked problem, including slugs for link generation.
 */
export interface BookmarkedProblemInfo {
  problemId: string;
  companySlug: string;
  problemSlug: string;
  bookmarkedAt?: Date; // Or Firestore Timestamp
}

/**
 * @description Information stored for each problem a user has marked with a status.
 */
export interface UserProblemStatusInfo {
  problemId: string; // Not explicitly stored as key is problemId, but useful for type clarity
  status: UserProblemStatus;
  companySlug: string;
  problemSlug: string;
  updatedAt?: Date; // Or Firestore Timestamp
}

// --- Domain Entity Logic ---

/**
 * User preferences for the application
 */
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  weeklyDigest?: boolean;
}

/**
 * Properties for the User entity
 */
export interface UserProps {
  email: string | null;
  displayName: string | null;
  photoUrl?: string;
  preferences: UserPreferences;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new User entity
 */
export type CreateUserInput = Omit<UserProps, "createdAt" | "updatedAt" | "preferences"> & {
  preferences?: UserPreferences;
};

/**
 * User Entity
 * Represents a user in the domain layer
 */
export class User extends Entity<UserProps> {
  get email(): string | null {
    return this.props.email;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }

  get preferences(): UserPreferences {
    return { ...this.props.preferences };
  }

  get lastSyncedAt(): Date | undefined {
    return this.props.lastSyncedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates the user's display name
   */
  public updateDisplayName(displayName: string | null): void {
    this.props.displayName = displayName;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's email
   */
  public updateEmail(email: string | null): void {
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's photo URL
   */
  public updatePhotoUrl(photoUrl: string): void {
    this.props.photoUrl = photoUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates user preferences
   */
  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.props.preferences = {
      ...this.props.preferences,
      ...preferences,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Marks the user as synced
   */
  public markSynced(): void {
    this.props.lastSyncedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Factory method to create a new User entity
   */
  public static create(props: CreateUserInput, id?: string): User {
    const now = new Date();
    return new User(
      {
        ...props,
        preferences: props.preferences ?? {},
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}
