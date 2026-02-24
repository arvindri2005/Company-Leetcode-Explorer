/**
 * Education Operations Module
 *
 * Provides CRUD operations for user education experiences backed by Supabase.
 * Education records are stored in the `user_education` table with snake_case
 * columns and mapped to camelCase domain objects.
 *
 * @module education-operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { EducationExperience } from "@/shared/types";

import { EducationValidatorsImpl } from "./education-validators";

/** Maximum number of education rows returned per query (pagination guard) */
const MAX_PAGE_SIZE = 50;

/**
 * Interface for education operations.
 */
export interface EducationOperations {
  /** Retrieve the user's education history, sorted newest-first */
  getUserEducation(userId: string): Promise<EducationExperience[]>;

  /** Add a new education experience entry for the user */
  addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link EducationOperations}.
 */
export class EducationOperationsImpl implements EducationOperations {
  private validators = new EducationValidatorsImpl();
  private supabase = createSupabaseBrowserClient();

  /**
   * Get the user's education history.
   *
   * Fetches all education rows for the user (up to MAX_PAGE_SIZE),
   * ordered by creation date descending (most recent first).
   * Supabase columns (snake_case) are mapped to domain fields (camelCase).
   *
   * @param userId - The user's uid
   * @returns Array of education experiences
   */
  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    if (!userId) {
      Logger.debug("[EducationOps.get] Skipped — empty userId");
      return [];
    }

    Logger.debug("[EducationOps.get] Fetching education history", { userId });

    try {
      const { data, error } = await this.supabase
        .from("user_education")
        .select("*")
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_PAGE_SIZE);

      if (error) {
        Logger.error("[EducationOps.get] Supabase query failed", error, { userId });
        throw error;
      }

      // Map snake_case DB columns → camelCase domain object
      const results = (data || []).map((row) => ({
        id: row.id,
        school: row.school,
        degree: row.degree,
        fieldOfStudy: row.field_of_study,
        startDate: row.start_date ? new Date(row.start_date) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        grade: row.grade,
        description: row.description,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
      } as unknown as EducationExperience));

      Logger.debug("[EducationOps.get] Education records fetched", {
        userId,
        count: results.length,
      });

      return results;
    } catch (error) {
      Logger.error("[EducationOps.get] Unexpected error", error, { userId });
      return [];
    }
  }

  /**
   * Add a new education experience entry.
   *
   * Flow:
   *   1. Validate the education data (XSS prevention, field constraints)
   *   2. Convert date strings (MM/YYYY or YYYY) to ISO date format
   *   3. Insert into Supabase and return the generated ID
   *
   * @param userId - The user's uid
   * @param educationData - The education data to add (without id)
   * @returns Result with the new record ID, or an error message
   */
  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      Logger.debug("[EducationOps.add] Skipped — empty userId");
      return { id: null, error: "User ID is required." };
    }

    Logger.debug("[EducationOps.add] Adding education experience", {
      userId,
      school: educationData.school,
      degree: educationData.degree,
    });

    // Security: Run validation to prevent XSS and enforce data integrity
    const validation = this.validators.validateEducationData(educationData, userId);
    if (!validation.isValid) {
      Logger.warn("[EducationOps.add] Validation failed", {
        userId,
        error: validation.error,
      });
      return { id: null, error: validation.error };
    }

    try {
      /**
       * Convert a date string in "MM/YYYY" or "YYYY" format to an ISO string.
       * Returns null for empty strings or "Present" (indicates current enrollment).
       */
      const toIsoDate = (dateStr: string | undefined): string | null => {
         if (!dateStr || dateStr === "Present") {return null;}
         const parts = dateStr.split("/");
         const date = parts.length === 2
           ? new Date(parseInt(parts[1], 10), parseInt(parts[0], 10) - 1, 1)
           : new Date(parseInt(parts[0], 10), 0, 1);
         return date.toISOString();
      };

      // Map camelCase domain fields → snake_case Supabase columns
      const dbRow = {
        uid: userId,
        school: educationData.school,
        degree: educationData.degree,
        field_of_study: educationData.fieldOfStudy,
        start_date: toIsoDate(educationData.startDate),
        end_date: toIsoDate(educationData.endDate),
        grade: educationData.grade,
        description: educationData.description,
      };

      Logger.debug("[EducationOps.add] Inserting education row", { userId });

      const { data, error } = await this.supabase
        .from("user_education")
        .insert(dbRow)
        .select("id")
        .single();

      if (error) {
        Logger.error("[EducationOps.add] Supabase insert failed", error, { userId });
        throw error;
      }

      Logger.info("[EducationOps.add] Education experience added", {
        userId,
        educationId: data.id,
      });

      return { id: data.id };
    } catch (error) {
      // Security: Return a generic error message to prevent leaking internal details
      Logger.error("[EducationOps.add] Unexpected error", error, { userId });
      return {
        id: null,
        error: "An unexpected error occurred while adding education experience.",
      };
    }
  }
}
