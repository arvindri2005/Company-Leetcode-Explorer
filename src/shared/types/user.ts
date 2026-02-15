import type { User } from "@supabase/supabase-js";

// Re-export from domain for backward compatibility
export {
  type SavedStrategyTodoList,
  SavedStrategyTodoListSchema,
} from "@/core/domain/entities/strategy.entity";
export {
  type BookmarkedProblemInfo,
  type EducationExperience,
  EducationExperienceSchema,
  type UserProblemStatusInfo,
  type UserProfile,
  UserProfileSchema,
  type WorkExperience,
  WorkExperienceSchema,
  WorkExperienceBaseSchema,
  validateWorkExperienceDates,
} from "@/core/domain/entities/user.entity"; // Adjusted path to core
export {
  type FocusTopic,
  FocusTopicSchema,
  type StrategyTodoItem,
  StrategyTodoItemSchema,
} from "@/core/domain/value-objects"; // Adjusted path to core if needed

// --- User Authentication and Profile Types ---

/**
 * @description Defines the shape of the authentication context.
 */
export interface AuthContextType {
  /** The currently authenticated Supabase user object, or null if not logged in. */
  user: User | null;
  /** Boolean indicating if the authentication state is still being loaded. */
  loading: boolean;
  /** Function to trigger a profile sync if needed. */
  syncUserProfileIfNeeded: (user: User, force?: boolean) => Promise<void>;
  /** Function to set the user state, typically used for testing or specific auth flows. */
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
}