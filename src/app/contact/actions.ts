"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
});

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
