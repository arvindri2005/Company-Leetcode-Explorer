"use client";

import { useFormStatus, useFormState } from "react-dom";
import { sendContactMessage } from "@/app/actions/contact.actions";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * A client component that renders a form submission button with a pending state.
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
 * Renders the contact form.
 */
export function ContactForm() {
  const [state, formAction] = useFormState(sendContactMessage, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.errors ? "Error" : "Success!", // Simple check, usually success message dictates success
        description: state.message,
        variant: state.errors ? "destructive" : "default",
      });
    }
  }, [state, toast]);

  return (
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
            autoComplete="name"
            required
            aria-invalid={!!state?.errors?.name}
            aria-describedby={state?.errors?.name ? "name-error" : undefined}
            className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        {state?.errors?.name && (
          <p id="name-error" role="alert" className="text-red-500 text-sm mt-1">
            {state.errors.name}
          </p>
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
            inputMode="email"
            required
            aria-invalid={!!state?.errors?.email}
            aria-describedby={state?.errors?.email ? "email-error" : undefined}
            className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        {state?.errors?.email && (
          <p id="email-error" role="alert" className="text-red-500 text-sm mt-1">
            {state.errors.email}
          </p>
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
            required
            aria-invalid={!!state?.errors?.message}
            aria-describedby={state?.errors?.message ? "message-error" : undefined}
            className="block w-full rounded-md border-gray-600 bg-gray-800 py-3 px-4 text-white shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        {state?.errors?.message && (
          <p id="message-error" role="alert" className="text-red-500 text-sm mt-1">
            {state.errors.message}
          </p>
        )}
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
