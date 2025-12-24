"use server";

import { z } from "zod";
import { contactService } from "@/services/contact.service";

/**
 * Zod schema for validating the contact form data.
 *
 * Ensures that `name`, `email`, and `message` fields are present and correctly formatted.
 * Adds length limits to prevent DoS/Resource Exhaustion.
 */
const contactSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z.string()
    .min(1, "Message is required")
    .max(5000, "Message must be less than 5000 characters"),
});

/**
 * Processes and saves a contact form submission.
 *
 * This server action performs the following steps:
 * 1. Validates the incoming `formData` against the `contactSchema`.
 * 2. If validation fails, it returns a structured error object for the client.
 * 3. On successful validation, it calls the ContactService to save the message.
 * 4. Returns a success message to the client.
 *
 * @param {any} prevState - The previous state from the `useFormState` hook (not used).
 * @param {FormData} formData - The data submitted from the contact form.
 * @returns {Promise<{ errors?: any; message?: string }>} An object containing either validation
 * errors or a success/failure message.
 */
export async function sendContactMessage(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await contactService.submitMessage(validatedFields.data);

    return {
      message: "Your message has been sent successfully!",
    };
  } catch (error) {
    console.error("Error saving contact message:", error);
    return {
      message:
        "An error occurred while sending your message. Please try again later.",
    };
  }
}
