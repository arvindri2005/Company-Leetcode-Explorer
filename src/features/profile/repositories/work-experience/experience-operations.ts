/**
 * Work Experience Operations Module
 * Handles work experience CRUD operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { WorkExperience } from "@/shared/types";

import { ExperienceValidatorsImpl } from "./experience-validators";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for work experience operations
 */
export interface ExperienceOperations {
  /**
   * Get user's work experience
   */
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;

  /**
   * Add work experience for a user
   */
  addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Implementation of work experience operations
 */
export class ExperienceOperationsImpl implements ExperienceOperations {
  private validators = new ExperienceValidatorsImpl();
  private supabase = createSupabaseBrowserClient();

  /**
   * Get user's work experience
   * @param userId - The user's unique identifier
   * @returns Array of work experiences
   */
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    if (!userId) {
      return [];
    }
    try {
      const { data, error } = await this.supabase
        .from("user_work_experience")
        .select("*")
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_PAGE_SIZE);

      if (error) {throw error;}

      return (data || []).map((row) => ({
        id: row.id,
        company: row.company,
        role: row.role,
        startDate: row.start_date ? new Date(row.start_date) : null,
        endDate: row.end_date ? new Date(row.end_date) : null,
        description: row.description,
        technologies: row.technologies || [],
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
      } as unknown as WorkExperience));
    } catch (error) {
      Logger.error(`Error fetching work experience`, error, { userId });
      return [];
    }
  }

  /**
   * Add work experience for a user
   * @param userId - The user's unique identifier
   * @param workData - The work experience data to add
   * @returns Result with ID if created, or error
   */
  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      return { id: null, error: "User ID is required." };
    }

    // Security: Validate data to prevent XSS and ensure data integrity
    const validation = this.validators.validateWorkExperienceData(workData, userId);
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    try {
      const dbRow = {
        uid: userId,
        company: workData.company,
        role: workData.role,
        start_date: workData.startDate,
        end_date: workData.endDate,
        description: workData.description,
        technologies: workData.technologies,
      };

      const { data, error } = await this.supabase
        .from("user_work_experience")
        .insert(dbRow)
        .select("id")
        .single();
        
      if (error) {throw error;}

      return { id: data.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding work experience to Supabase", error);
      return {
        id: null,
        error: "An unexpected error occurred while adding work experience.",
      };
    }
  }
}
