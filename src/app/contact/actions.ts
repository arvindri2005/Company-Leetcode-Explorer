/**
 * @fileoverview Defines the server action for handling contact form submissions.
 *
 * This file contains a Next.js server action that validates the data from the
 * contact form using Zod and saves the message to the Firestore database if
 * the validation is successful. It is designed to be used with the `useFormState`
 * hook on the client side.
 */
"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Zod schema for validating the contact form data.
 *
 * Ensures that `name`, `email`, and `message` fields are present and correctly formatted.
 */
const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
});

/**
 * Processes and saves a contact form submission.
 *
 * This server action performs the following steps:
 * 1. Validates the incoming `formData` against the `contactSchema`.
 * 2. If validation fails, it returns a structured error object for the client.
 * 3. If the database is unavailable, it returns a generic error message.
 * 4. On successful validation, it saves the message to the `contact-messages`
 *    collection in Firestore, along with a server-side timestamp.
 * 5. Returns a success message to the client.
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

    if (!db) {
        return {
            message: "Database not available. Please try again later.",
        };
    }

    try {
        await addDoc(collection(db, "contact-messages"), {
            ...validatedFields.data,
            createdAt: serverTimestamp(),
        });

        return {
            message: "Your message has been sent successfully!",
        };
    } catch (error) {
        console.error("Error saving contact message:", error);
        return {
            message: "An error occurred while sending your message. Please try again later.",
        };
    }
}
