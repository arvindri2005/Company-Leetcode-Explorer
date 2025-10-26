/**
 * @fileoverview Defines the user registration (sign-up) page for the application.
 *
 * This file exports a Next.js page component that provides the user interface
 * for creating a new account. It includes metadata for SEO and renders the
 * `SignupForm` component, which contains the actual registration logic and UI.
 */
import SignupForm from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Metadata for the Sign Up page.
 *
 * This object provides SEO information, including the page title and description,
 * which are used by search engines and in browser tabs.
 *
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: "Sign Up | Byte To Offer",
  description:
    "Create your Byte To Offer account to access personalized interview prep, track your progress, and contribute to our community of developers.",
};

/**
 * Renders the user sign-up page.
 *
 * This server component sets up the layout for the registration screen, displaying
 * a welcoming message within a card. It then renders the client-side `SignupForm`
 * component, which handles the user registration process.
 *
 * @returns {JSX.Element} The rendered sign-up page.
 */
export default function SignupPage() {
  return (
    <section className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md border border-border rounded-3xl mb-8 shadow-sm">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create an Account
          </h1>
          <CardDescription className="text-lg">
            Join us and start exploring!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </section>
  );
}
