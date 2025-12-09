/**
 * @fileoverview Defines the login page for the application.
 *
 * This file exports a Next.js page component that provides the user interface
 * for logging into the application. It includes metadata for SEO and renders
 * the `LoginForm` component, which contains the actual authentication logic and UI.
 */
import LoginForm from "@/components/auth/login-form";
import AuthLayout from "@/components/auth/auth-layout";

/**
 * Metadata for the Login page.
 *
 * This object provides SEO information, including the page title and description,
 * which are used by search engines and in browser tabs.
 *
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: "Login | Byte To Offer",
  description:
    "Log in to your Byte To Offer account to continue your personalized interview preparation, access saved problems, and track your progress.",
};

/**
 * Renders the user login page.
 *
 * This server component sets up the layout for the login screen, displaying
 * a welcoming message within a card. It then renders the client-side `LoginForm`
 * component, which handles the user authentication process.
 *
 * @returns {JSX.Element} The rendered login page.
 */
export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back!"
      description="Sign in to access your account."
    >
      <LoginForm />
    </AuthLayout>
  );
}
