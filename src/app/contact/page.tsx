/**
 * @fileoverview Defines the client-side component for the contact page.
 *
 * This file contains the main component for the `/contact` route.
 * It now delegates the form logic to the `ContactForm` component.
 */
"use client";

import Footer from "@/components/landing/footer";
import { ContactForm } from "@/components/contact/contact-form";

/**
 * Renders the contact page with the ContactForm component.
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
