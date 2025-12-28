import { z } from "zod";
import type { User as FirebaseUser } from "firebase/auth";
import type { ProblemStatus } from "./problem";
import type { FocusTopic, StrategyTodoItem } from "./ai";

// --- User Authentication and Profile Types ---
/**
 * @description Represents a user's profile information stored in Firestore.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date; // Or Firestore Timestamp if directly from DB
  lastSyncedAt?: Date;
  // educationHistory and workHistory will be fetched from subcollections
}

/**
 * @description Defines the shape of the authentication context.
 */
export interface AuthContextType {
  /** The currently authenticated Firebase user object, or null if not logged in. */
  user: FirebaseUser | null;
  /** Boolean indicating if the authentication state is still being loaded. */
  loading: boolean;
  /** Boolean indicating if the user's profile has been synced with Firestore during the current session. */
  isUserProfileSynced: boolean;
  /** Function to trigger a profile sync with Firestore if needed. */
  syncUserProfileIfNeeded: (firebaseUser: FirebaseUser) => Promise<void>;
  /** Function to set the user state, typically used for testing or specific auth flows. */
  setUser?: React.Dispatch<React.SetStateAction<FirebaseUser | null>>;
}

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
  status: ProblemStatus;
  companySlug: string;
  problemSlug: string;
  updatedAt?: Date; // Or Firestore Timestamp
}

// --- User Experience Types ---
/**
 * @description Zod schema for validating education experience data.
 */
export const EducationExperienceSchema = z.object({
  id: z.string().optional(), // Firestore document ID, optional for new entries
  degree: z.string().min(2, "Degree is required."),
  major: z.string().min(2, "Major is required."),
  school: z.string().min(2, "School name is required."),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, "Invalid year format (YYYY).")
    .optional()
    .or(z.literal("")),
  gpa: z.string().optional().or(z.literal("")), // Keep as string to allow various formats or N/A
});
/**
 * @description Represents a user's educational experience.
 */
export type EducationExperience = z.infer<typeof EducationExperienceSchema>;

/**
 * @description Zod schema for validating work experience data.
 */
export const WorkExperienceSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  jobTitle: z.string().min(2, "Job title is required."),
  companyName: z.string().min(2, "Company name is required."),
  startDate: z
    .string()
    .min(4, "Start date is required.")
    .regex(
      /^(\d{4}|(0[1-9]|1[0-2])\/\d{4})$/,
      "Start date must be in YYYY or MM/YYYY format."
    ),
  endDate: z.string().optional().or(z.literal("")), // Optional, string for flexibility (e.g., "Present", YYYY, MM/YYYY)
  responsibilities: z
    .string()
    .min(10, "Please describe some responsibilities.")
    .optional()
    .or(z.literal("")),
});
/**
 * @description Represents a user's work experience.
 */
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

/**
 * @description Represents a saved strategy todo list for a user and a company.
 * This now also includes the preparation strategy and focus topics.
 */
export interface SavedStrategyTodoList {
  companyId: string; // The ID of the company this list is for
  companyName: string;
  savedAt: Date; // Or Firestore Timestamp
  preparationStrategy: string;
  focusTopics: FocusTopic[];
  items: StrategyTodoItem[]; // 'items' is used for the todo list for consistency with previous naming
}
