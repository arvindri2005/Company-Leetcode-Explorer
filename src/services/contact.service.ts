import { contactRepository } from "@/repositories/contact.repository";
import { appEvents } from "@/services/event-bus";

export interface ContactMessageData {
  name: string;
  email: string;
  message: string;
}

export class ContactService {
  /**
   * Submits a contact message.
   * This is an EXTENSION POINT:
   * - Persists to database (Core)
   * - Emits 'contact:message_received' event for plugins (Email, Slack, CRM)
   */
  async submitMessage(data: ContactMessageData): Promise<void> {
    // 1. Core Persistence
    await contactRepository.createContactMessage(data);

    // 2. Extension Point (Middleware/Plugins)
    await appEvents.emit("contact:message_received", {
      ...data,
      timestamp: new Date(),
    });
  }
}

export const contactService = new ContactService();
