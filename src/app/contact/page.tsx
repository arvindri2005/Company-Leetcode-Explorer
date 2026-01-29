/**
 * @fileoverview Defines the server component for the contact page.
 *
 * This file contains the main server component for the `/contact` route.
 * It provides SEO metadata and wraps the client-side ContactForm component.
 */

import type { Metadata } from "next";

import { env } from "@/env";
import { ContactForm } from "@/features/contact/components/contact-form";
import Footer from "@/features/landing/components/footer";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  title: "Contact Us | Byte to Offer",
  description:
    "Get in touch with us! Have questions about interview preparation, feedback on our platform, or suggestions? We'd love to hear from you.",
  openGraph: {
    title: "Contact Us | Byte to Offer",
    description: "Get in touch with us! Have questions about interview preparation, feedback on our platform, or suggestions? We'd love to hear from you.",
    url: `${APP_URL}/contact`,
    siteName: "Byte to Offer",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Us | Byte to Offer",
    description: "Get in touch with us! Have questions about interview preparation, feedback on our platform, or suggestions? We'd love to hear from you.",
  },
};

/**
 * Server Component: Renders the contact page with the ContactForm component.
 *
 * @returns {JSX.Element} The rendered contact page.
 */
export default function ContactPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
          Contact Us
        </h1>
        <p className="mt-4 text-muted-foreground">
          Have a question or want to give us feedback? Fill out the form below.
        </p>

        <ContactForm />
      </div>
      <Footer />
    </div>
  );
}

