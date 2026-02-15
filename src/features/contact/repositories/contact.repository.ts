import { z } from "zod";

import type { Contact as ContactEntity } from "@/core/domain/entities/contact.entity";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";
import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";

import type { IContactRepository } from "../interfaces/contact.repository.interface";

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

export class ContactRepository implements IContactRepository {
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

  async getContactMessages(params?: PaginationParams): Promise<PaginatedResult<ContactEntity>> {
     const page = params?.page || 1;
     const pageSize = params?.pageSize || 10;
     const start = (page - 1) * pageSize;
     const end = start + pageSize - 1;

     const { data, error, count } = await this.supabase
       .from("contact_messages")
       .select("*", { count: "exact" })
       .range(start, end)
       .order("created_at", { ascending: false });

     if (error) {
       throw new Error(`Error fetching contact messages: ${error.message}`);
     }

     return {
       items: data as unknown as ContactEntity[],
       totalItems: count || 0,
       hasMore: (page * pageSize) < (count || 0),
       currentPage: page,
       totalPages: Math.ceil((count || 0) / pageSize),
     };
  }

  async getContactMessagesByStatus(
    status: "pending" | "read" | "replied" | "archived",
    params?: PaginationParams
  ): Promise<PaginatedResult<ContactEntity>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await this.supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .eq("status", status)
      .range(start, end)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching contact messages by status: ${error.message}`);
    }

    return {
      items: data as unknown as ContactEntity[],
      totalItems: count || 0,
      hasMore: (page * pageSize) < (count || 0),
       currentPage: page,
       totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

   // Base Repository Implementation

  async findAll(params?: PaginationParams): Promise<PaginatedResult<ContactEntity>> {
    return this.getContactMessages(params);
  }

  async save(data: Partial<ContactEntity>): Promise<ContactEntity> {
    // Reuse create logic but we need to return the entity.
    // Since createContactMessage returns void and takes specific data, we adapt here.
    // Assuming 'data' contains necessary fields.
    const contactData = data as ContactMessageData;
    
    const { data: created, error } = await this.supabase
      .from("contact_messages")
      .insert({
        name: contactData.name,
        email: contactData.email,
        message: contactData.message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error saving contact: ${error.message}`);
    }
    return created as unknown as ContactEntity;
  }

  async update(id: string, data: Partial<ContactEntity>): Promise<ContactEntity> {
      const { data: updated, error } = await this.supabase
        .from("contact_messages")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {throw new Error(error.message);}
      return updated as unknown as ContactEntity;
  }

  async delete(id: string): Promise<void> {
      const { error } = await this.supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (error) {throw new Error(error.message);}
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("contact_messages")
      .select("*", { count: 'exact', head: true })
      .eq("id", id);
    
    if (error) {return false;}
    return (count || 0) > 0;
  }
  async findById(id: string): Promise<ContactEntity | null> {
    const { data, error } = await this.supabase
      .from("contact_messages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
       if (error.code === 'PGRST116') {return null;} // Not found
       throw new Error(`Error fetching contact message: ${error.message}`);
    }
    
    return data as unknown as ContactEntity;
  }

  async markAsRead(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from("contact_messages")
      .update({ status: "read", updated_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) {return { success: false, error: error.message };}
    return { success: true };
  }

  async markAsReplied(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from("contact_messages")
      .update({ status: "replied", updated_at: new Date().toISOString() })
      .eq("id", id);

     if (error) {return { success: false, error: error.message };}
     return { success: true };
  }

  async archive(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from("contact_messages")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id);

     if (error) {return { success: false, error: error.message };}
     return { success: true };
  }
}

export const contactRepository = new ContactRepository();
