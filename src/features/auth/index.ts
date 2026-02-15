import { registerAuthNavigation } from "./navigation";

// Register Auth-related navigation items (e.g., Logout) with the shared registry
registerAuthNavigation();

// Auth Context
export { AuthContext,AuthProvider } from "./context/auth-context";

// Auth Hooks
export { useAuth } from "./hooks/use-auth";

// Auth Services
export { authService } from "./services/auth.service";

// Auth Types
export type { 
  AuthContextType, 
  AuthServiceResponse,
  LoginCredentials,
  RegisterCredentials 
} from "./types";

// Auth Components
export {
  AuthLayout,
  ForgotPasswordForm,
  GoogleAuthButton,
  LoginForm,
  PasswordStrengthIndicator,
  ResetPasswordForm,
  SignupForm,
  VerifyEmail,
} from "./components";






