import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
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
  private supabase = createSupabaseBrowserClient();

  async createContactMessage(data: ContactMessageData): Promise<void> {

    // Validate data before sending to Supabase
    const validationResult = contactMessageSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid contact message data: ${validationResult.error.message}`);
    }
    
    const { error } = await this.supabase
      .from("contact_messages")
      .insert({
        name: data.name,
        email: data.email,
        message: data.message,
      });

    if (error) {
      throw new Error(`Error saving contact message: ${error.message}`);
    }
  }
}

export const contactRepository = new ContactRepository();






