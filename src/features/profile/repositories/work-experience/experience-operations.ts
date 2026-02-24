/**
 * Work Experience Operations Module
 *
 * Provides CRUD operations for user work experiences backed by Supabase.
 * Work experience records are stored in the `user_work_experience` table
 * with snake_case columns and mapped to camelCase domain objects.
 *
 * @module experience-operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { WorkExperience } from "@/shared/types";

import { ExperienceValidatorsImpl } from "./experience-validators";

/** Maximum number of work experience rows returned per query (pagination guard) */
const MAX_PAGE_SIZE = 50;

/**
 * Interface for work experience operations.
 */
export interface ExperienceOperations {
  /** Retrieve the user's work experience history, sorted newest-first */
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;

  /** Add a new work experience entry for the user */
  addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link ExperienceOperations}.
 */
export class ExperienceOperationsImpl implements ExperienceOperations {
  private validators = new ExperienceValidatorsImpl();
  private supabase = createSupabaseBrowserClient();

  /**
   * Get the user's work experience history.
   *
   * Fetches all work experience rows for the user (up to MAX_PAGE_SIZE),
   * ordered by creation date descending (most recent first).
   * Supabase columns (snake_case) are mapped to domain fields (camelCase).
   *
   * @param userId - The user's uid
   * @returns Array of work experiences
   */
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    if (!userId) {
      Logger.debug("[ExperienceOps.get] Skipped — empty userId");
      return [];
    }

    Logger.debug("[ExperienceOps.get] Fetching work experience", { userId });

    try {
      const { data, error } = await this.supabase
        .from("user_work_experience")
        .select("*")
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_PAGE_SIZE);

      if (error) {
        Logger.error("[ExperienceOps.get] Supabase query failed", error, { userId });
        throw error;
      }

      // Map snake_case DB columns → camelCase domain object
      const results = (data || []).map((row) => ({
        id: row.id,
        company: row.company,
        role: row.role,
        startDate: row.start_date ? new Date(row.start_date) : null,
        endDate: row.end_date ? new Date(row.end_date) : null,
        description: row.description,
        technologies: row.technologies || [],
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
      } as unknown as WorkExperience));

      Logger.debug("[ExperienceOps.get] Work experience records fetched", {
        userId,
        count: results.length,
      });

      return results;
    } catch (error) {
      Logger.error("[ExperienceOps.get] Unexpected error", error, { userId });
      return [];
    }
  }

  /**
   * Add a new work experience entry.
   *
   * Flow:
   *   1. Validate the work data (XSS prevention, field constraints)
   *   2. Map camelCase domain fields → snake_case Supabase columns
   *   3. Insert into Supabase and return the generated ID
   *
   * @param userId - The user's uid
   * @param workData - The work experience data to add (without id)
   * @returns Result with the new record ID, or an error message
   */
  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      Logger.debug("[ExperienceOps.add] Skipped — empty userId");
      return { id: null, error: "User ID is required." };
    }

    Logger.debug("[ExperienceOps.add] Adding work experience", {
      userId,
      company: workData.company,
      role: workData.role,
    });

    // Security: Run validation to prevent XSS and enforce data integrity
    const validation = this.validators.validateWorkExperienceData(workData, userId);
    if (!validation.isValid) {
      Logger.warn("[ExperienceOps.add] Validation failed", {
        userId,
        error: validation.error,
      });
      return { id: null, error: validation.error };
    }

    try {
      // Map camelCase domain fields → snake_case Supabase columns
      const dbRow = {
        uid: userId,
        company: workData.company,
        role: workData.role,
        start_date: workData.startDate,
        end_date: workData.endDate,
        description: workData.description,
        technologies: workData.technologies,
      };

      Logger.debug("[ExperienceOps.add] Inserting work experience row", { userId });

      const { data, error } = await this.supabase
        .from("user_work_experience")
        .insert(dbRow)
        .select("id")
        .single();
        
      if (error) {
        Logger.error("[ExperienceOps.add] Supabase insert failed", error, { userId });
        throw error;
      }

      Logger.info("[ExperienceOps.add] Work experience added", {
        userId,
        experienceId: data.id,
      });

      return { id: data.id };
    } catch (error) {
      // Security: Return a generic error message to prevent leaking internal details
      Logger.error("[ExperienceOps.add] Unexpected error", error, { userId });
      return {
        id: null,
        error: "An unexpected error occurred while adding work experience.",
      };
    }
  }
}
