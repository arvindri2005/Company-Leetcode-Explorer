import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface ContactMessageData {
  name: string;
  email: string;
  message: string;
}

export class ContactRepository {
  async createContactMessage(data: ContactMessageData): Promise<void> {
    if (!db) {
      throw new Error("Database not available");
    }
    
    await addDoc(collection(db, "contact-messages"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
}

export const contactRepository = new ContactRepository();
