/**
 * @fileoverview Defines the login page for the application.
 *
 * This file exports a Next.js page component that provides the user interface
 * for logging into the application. It includes metadata for SEO and renders
 * the `LoginForm` component, which contains the actual authentication logic and UI.
 */
import LoginForm from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <section className="flex min-h-[calc(100vh-4rem)] justify-center items-center py-12">
      <Card className="w-full max-w-md border-border/50 bg-card/60 backdrop-blur-xl rounded-3xl mb-8 shadow-2xl relative z-10 overflow-hidden">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <CardDescription className="text-lg">
            Sign in to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </section>
  );
}
