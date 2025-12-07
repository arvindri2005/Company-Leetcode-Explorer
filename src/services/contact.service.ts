import { contactRepository } from "@/repositories/contact.repository";

export interface ContactMessageData {
  name: string;
  email: string;
  message: string;
}

export class ContactService {
  async submitMessage(data: ContactMessageData): Promise<void> {
    // Business logic could go here (e.g., spam check, email notification trigger)
    return await contactRepository.createContactMessage(data);
  }
}

export const contactService = new ContactService();
