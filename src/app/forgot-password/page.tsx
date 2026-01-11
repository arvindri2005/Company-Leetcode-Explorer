/**
 * @fileoverview Defines the forgot password page for the application.
 *
 * This file exports a Next.js page component that provides the user interface
 * for initiating a password reset. It uses `AuthLayout` for consistency and
 * `ForgotPasswordForm` for the functionality.
 */
import AuthLayout from "@/features/auth/components/auth-layout";
import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";

/**
 * Metadata for the Forgot Password page.
 */
export const metadata = {
  title: "Forgot Password | Byte To Offer",
  description:
    "Reset your password for Byte To Offer to regain access to your account and continue your interview preparation.",
};

/**
 * Renders the forgot password page.
 *
 * @returns {JSX.Element} The rendered forgot password page.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      description="Enter your email to receive a reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}






