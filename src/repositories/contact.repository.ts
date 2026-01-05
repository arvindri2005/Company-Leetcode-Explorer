import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

export interface ContactMessageData {
  name: string;
  email: string;
  message: string;
}

// Validation schema for contact message data
export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().min(1).max(100),
  message: z.string().min(1).max(2000),
});

export class ContactRepository {
  async createContactMessage(data: ContactMessageData): Promise<void> {
    if (!db) {
      throw new Error("Database not available");
    }

    // Validate data before sending to Firestore
    const validationResult = contactMessageSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid contact message data: ${validationResult.error.message}`);
    }
    
    await addDoc(collection(db, "contact-messages"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
}

export const contactRepository = new ContactRepository();
