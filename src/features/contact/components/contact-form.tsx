"use client";

import { useEffect } from "react";
import { useFormState,useFormStatus } from "react-dom";

import { sendContactMessage } from "@/features/contact/actions/contact.actions";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { useToast } from "@/shared/hooks/use-toast";

/**
 * A client component that renders a form submission button with a pending state.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  const isOnline = useOnlineStatus();

  const getButtonText = () => {
    if (pending) {
      return "Sending...";
    }
    if (isOnline) {
      return "Send Message";
    }
    return "You are offline";
  };

  return (
    <Button
      type="submit"
      isLoading={pending}
      disabled={!isOnline || pending}
      className="w-full sm:w-auto px-8"
      size="lg"
    >
      {getButtonText()}
    </Button>
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
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          Name
        </label>
        <div className="mt-1">
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            required
            aria-invalid={!!state?.errors?.name}
            aria-describedby={state?.errors?.name ? "name-error" : undefined}
            className="bg-input border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
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
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          Email
        </label>
        <div className="mt-1">
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-invalid={!!state?.errors?.email}
            aria-describedby={state?.errors?.email ? "email-error" : undefined}
            className="bg-input border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
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
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          Message
        </label>
        <div className="mt-1">
          <Textarea
            id="message"
            name="message"
            rows={4}
            required
            aria-invalid={!!state?.errors?.message}
            aria-describedby={state?.errors?.message ? "message-error" : undefined}
            className="bg-input border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
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






