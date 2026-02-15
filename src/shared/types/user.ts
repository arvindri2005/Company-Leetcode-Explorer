import type { User as FirebaseUser } from "firebase/auth";

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
} from "@/domain/entities/user.entity";
export {
  type FocusTopic,
  FocusTopicSchema,
  type StrategyTodoItem,
  StrategyTodoItemSchema,
} from "@/domain/value-objects";


// --- User Authentication and Profile Types ---

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