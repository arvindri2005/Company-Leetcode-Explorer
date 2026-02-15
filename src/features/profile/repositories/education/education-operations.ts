/**
 * Education Operations Module
 * Handles education CRUD operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { EducationExperience } from "@/shared/types";

import { EducationValidatorsImpl } from "./education-validators";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for education operations
 */
export interface EducationOperations {
  /**
   * Get user's education history
   */
  getUserEducation(userId: string): Promise<EducationExperience[]>;

  /**
   * Add education experience for a user
   */
  addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Implementation of education operations
 */
export class EducationOperationsImpl implements EducationOperations {
  private validators = new EducationValidatorsImpl();
  private supabase = createSupabaseBrowserClient();

  /**
   * Get user's education history
   * @param userId - The user's unique identifier
   * @returns Array of education experiences
   */
  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    if (!userId) {
      return [];
    }
    try {
      const { data, error } = await this.supabase
        .from("user_education")
        .select("*")
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_PAGE_SIZE);

      if (error) {throw error;}

      return (data || []).map((row) => ({
        id: row.id,
        school: row.school,
        degree: row.degree,
        fieldOfStudy: row.field_of_study,
        startDate: row.start_date ? new Date(row.start_date) : undefined, // Could be null, but type says undefined?
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        grade: row.grade,
        description: row.description,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
      } as unknown as EducationExperience));
    } catch (error) {
      Logger.error(`Error fetching education history`, error, { userId });
      return [];
    }
  }

  /**
   * Add education experience for a user
   * @param userId - The user's unique identifier
   * @param educationData - The education data to add
   * @returns Result with ID if created, or error
   */
  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      return { id: null, error: "User ID is required." };
    }

    // Security: Validate data to prevent XSS and ensure data integrity
    const validation = this.validators.validateEducationData(educationData, userId);
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    try {
      // Helper to convert MM/YYYY or YYYY to ISO string for Supabase
      const toIsoDate = (dateStr: string | undefined): string | null => {
         if (!dateStr || dateStr === "Present") {return null;}
         // Assume MM/YYYY or YYYY. 
         const parts = dateStr.split("/");
         const date = parts.length === 2 ? new Date(parseInt(parts[1], 10), parseInt(parts[0], 10) - 1, 1) : new Date(parseInt(parts[0], 10), 0, 1);
         return date.toISOString();
      };

      const dbRow = {
        uid: userId,
        school: educationData.school,
        degree: educationData.degree,
        field_of_study: educationData.fieldOfStudy,
        start_date: toIsoDate(educationData.startDate), // Map string to ISO
        end_date: toIsoDate(educationData.endDate),
        grade: educationData.grade,
        description: educationData.description,
      };

      const { data, error } = await this.supabase
        .from("user_education")
        .insert(dbRow)
        .select("id")
        .single();

      if (error) {throw error;}

      return { id: data.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding education experience to Supabase", error);
      return {
        id: null,
        error: "An unexpected error occurred while adding education experience.",
      };
    }
  }
}
