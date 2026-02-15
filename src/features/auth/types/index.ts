import type { User } from "@supabase/supabase-js";

/**
 * @description Defines the shape of the authentication context.
 */
export interface AuthContextType {
  /** The currently authenticated Supabase user object, or null if not logged in. */
  user: User | null;
  /** Boolean indicating if the authentication state is still being loaded. */
  loading: boolean;
  /** Function to trigger a profile sync with Supabase if needed. */
  syncUserProfileIfNeeded: (
    supabaseUser: User,
    force?: boolean,
  ) => Promise<void>;
  /** Function to set the user state, typically used for testing or specific auth flows. */
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
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
