/**
 * @fileoverview Defines the client-side component for the contact page.
 *
 * This file contains the main component for the `/contact` route, which includes
 * an interactive form for users to send messages. It utilizes React hooks like
 * `useFormState` and `useFormStatus` to handle form submission, validation feedback,
 * and loading states, interacting with a server action.
 */
"use client";

import Footer from "@/components/landing/footer";
import { useFormState, useFormStatus } from "react-dom";
import { sendContactMessage } from "@/app/contact/actions";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * A client component that renders a form submission button with a pending state.
 *
 * This button automatically disables itself and displays a "Sending..." message
 * while the form submission is in progress, using the `useFormStatus` hook to
 * track the form's pending state.
 *
 * @returns {JSX.Element} The rendered submit button.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center rounded-md border border-transparent bg-primary py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send Message"}
    </button>
  );
}

/**
 * Renders the interactive contact page with a form for user submissions.
 *
 * This component uses the `useFormState` hook to manage the state of the form
 * submission, including handling success messages and validation errors returned
 * from the `sendContactMessage` server action. It displays a toast notification
 * upon successful submission.
 *
 * @returns {JSX.Element} The rendered contact page with the submission form.
 */
export default function ContactPage() {
  const [state, formAction] = useFormState(sendContactMessage, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: "Success!",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-4 text-muted-foreground">
          Have a question or want to give us feedback? Fill out the form below.
        </p>

        <form action={formAction} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-400"
            >
              Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            {state?.errors?.name && (
              <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400"
            >
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            {state?.errors?.email && (
              <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-400"
            >
              Message
            </label>
            <div className="mt-1">
              <textarea
                id="message"
                name="message"
                rows={4}
                className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            {state?.errors?.message && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.message}
              </p>
            )}
          </div>
          <div>
            <SubmitButton />
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
