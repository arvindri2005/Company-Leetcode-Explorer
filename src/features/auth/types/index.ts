import type { User as FirebaseUser } from "firebase/auth";

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
 * @description Auth service response type
 */
export interface AuthServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * @description Login credentials type
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * @description Registration credentials type
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}






