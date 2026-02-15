/**
 * Company CRUD Operations Module
 * Handles create, read, update, delete operations for companies
 * Data source: Supabase (PostgreSQL)
 */

import { supabase } from "@/shared/lib/api/supabase";
import { slugify } from "@/shared/lib/utils";
import { Logger } from "@/shared/lib/utils/logger";
import type { Company } from "@/shared/types";

import type {
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../../interfaces/company.repository.interface";
import {
  sanitizeUpdateData,
  validateCreateCompany,
  validateUpdateCompany,
} from "../validators/company-validators";

const MAX_ALL_SLUGS_LIMIT = 10000;

/**
 * Interface for Company CRUD Operations
 */
export interface CompanyCrudOperations {
  getCompanyById(id: string): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getAllCompanySlugs(sorted?: boolean): Promise<string[]>;
  addCompany(
    companyData: CreateCompanyDTO
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }>;
  updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO
  ): Promise<{ success: boolean; error?: string }>;
  deleteCompany(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

/**
 * Supabase row types for company-related tables
 */
interface SupabaseCompanyStatsRow {
  company_id: string;
  last_30_days: number;
  within_3_months: number;
  within_6_months: number;
  older_than_6_months: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
}

interface SupabaseCompanyTagRow {
  id: number;
  company_id: string;
  tag: string;
  count: number;
}

interface SupabaseRelatedCompanyRow {
  company_id: string;
  related_company_id: string;
}

export interface SupabaseCompanyRow {
  id: string;
  name: string;
  normalized_name: string | null;
  website: string | null;
  slug: string | null;
  logo: string | null;
  problem_count: number;
  stats_last_updated_at: string | null;
  created_at: string | null;
  company_stats: SupabaseCompanyStatsRow[] | SupabaseCompanyStatsRow | null;
  company_tags: SupabaseCompanyTagRow[] | null;
  related_companies: SupabaseRelatedCompanyRow[] | null;
}

/** Full select query with all joined tables */
const COMPANY_SELECT_WITH_JOINS =
  "*, company_stats(*), company_tags(*), related_companies(*)";

/**
 * Map a Supabase row (with joined data) to the application Company type
 */
export function mapSupabaseRowToCompany(row: SupabaseCompanyRow): Company {
  // company_stats comes as an array from the join; take the first element
  const stats = Array.isArray(row.company_stats)
    ? row.company_stats[0]
    : row.company_stats;

  const tags: Array<{ tag: string; count: number }> = Array.isArray(
    row.company_tags
  )
    ? row.company_tags.map((t) => ({ tag: t.tag, count: t.count }))
    : [];

  const relatedCompanies: string[] = Array.isArray(row.related_companies)
    ? row.related_companies.map((r) => r.related_company_id)
    : [];

  const company: Company = {
    id: row.id,
    slug: row.slug || row.id || slugify(row.name || ""),
    name:
      row.name || row.id.charAt(0).toUpperCase() + row.id.slice(1),
    normalizedName:
      row.normalized_name ||
      row.name?.toLowerCase() ||
      row.id.toLowerCase(),
    logo: row.logo || undefined,
    website: row.website || undefined,
    problemCount: row.problem_count || 0,
    difficultyCounts: stats
      ? {
          Easy: stats.easy_count || 0,
          Medium: stats.medium_count || 0,
          Hard: stats.hard_count || 0,
        }
      : { Easy: 0, Medium: 0, Hard: 0 },
    recencyCounts: stats
      ? {
          last_30_days: stats.last_30_days || 0,
          within_3_months: stats.within_3_months || 0,
          within_6_months: stats.within_6_months || 0,
          older_than_6_months: stats.older_than_6_months || 0,
        }
      : {
          last_30_days: 0,
          within_3_months: 0,
          within_6_months: 0,
          older_than_6_months: 0,
        },
    commonTags: tags,
    relatedCompanies,
    statsLastUpdatedAt: row.stats_last_updated_at
      ? new Date(row.stats_last_updated_at)
      : undefined,
  };

  return company;
}

/**
 * Company CRUD Operations Implementation (Supabase)
 */
export class CompanyCrud implements CompanyCrudOperations {
  /**
   * Get a company by its ID
   */
  async getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) {
      return undefined;
    }
    try {
      const { data, error } = await supabase
        .from("companies")
        .select(COMPANY_SELECT_WITH_JOINS)
        .eq("id", id)
        .single();

      if (error || !data) {
        if (error?.code === "PGRST116") {
          // Row not found
          return undefined;
        }
        if (error) {
          Logger.error("Error fetching company by ID", error, { id });
        }
        return undefined;
      }

      return mapSupabaseRowToCompany(data as SupabaseCompanyRow);
    } catch (error) {
      Logger.error(`Error fetching company by ID`, error, { id });
      return undefined;
    }
  }

  /**
   * Get a company by its slug
   */
  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    if (!slug) {
      return undefined;
    }
    try {
      const { data, error } = await supabase
        .from("companies")
        .select(COMPANY_SELECT_WITH_JOINS)
        .eq("slug", slug)
        .single();

      if (error || !data) {
        if (error?.code === "PGRST116") {
          return undefined;
        }
        if (error) {
          Logger.error("Error fetching company by slug", error, { slug });
        }
        return undefined;
      }

      return mapSupabaseRowToCompany(data as SupabaseCompanyRow);
    } catch (error) {
      Logger.error(`Error fetching company by slug`, error, { slug });
      return undefined;
    }
  }

  /**
   * Get all company slugs
   */
  async getAllCompanySlugs(sorted: boolean = true): Promise<string[]> {
    try {
      let query = supabase
        .from("companies")
        .select("slug")
        .limit(MAX_ALL_SLUGS_LIMIT);

      if (sorted) {
        query = query.order("slug", { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        Logger.error("Error fetching all company slugs", error);
        return [];
      }

      return (data || [])
        .map((row: { slug: string | null }) => row.slug)
        .filter((slug): slug is string => slug !== null);
    } catch (error) {
      Logger.error("Error fetching all company slugs", error);
      return [];
    }
  }

  /**
   * Add a new company
   */
  async addCompany(
    companyData: CreateCompanyDTO
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }> {
    try {
      // Security: Use centralized validator to ensure consistency and DRY
      const validation = validateCreateCompany(companyData);

      if (!validation.success || !validation.data) {
        return { id: null, error: validation.error || "Validation failed" };
      }

      // Security: Use validated data
      const safeData = validation.data;

      const companySlug = slugify(safeData.name);

      if (!companySlug) {
        return {
          id: null,
          error:
            "Unable to generate a valid slug from company name. Please use alphanumeric characters.",
        };
      }

      const normalizedName = safeData.name.toLowerCase().trim();

      // Check if company already exists
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("id", companySlug)
        .single();

      if (existing) {
        return {
          id: companySlug,
          error: `Company with name "${safeData.name}" already exists.`,
          alreadyExists: true,
        };
      }

      // Insert the company
      const { error: insertError } = await supabase
        .from("companies")
        .insert({
          id: companySlug,
          name: safeData.name.trim(),
          normalized_name: normalizedName,
          slug: companySlug,
          logo: safeData.logo || null,
          website: safeData.website?.trim() || null,
          problem_count: 0,
        });

      if (insertError) {
        // Handle unique constraint violation
        if (insertError.code === "23505") {
          return {
            id: companySlug,
            error: `Company with name "${safeData.name}" already exists.`,
            alreadyExists: true,
          };
        }
        throw insertError;
      }

      // Insert related companies if provided
      if (safeData.relatedCompanies && safeData.relatedCompanies.length > 0) {
        const relatedRows = safeData.relatedCompanies.map((relatedId) => ({
          company_id: companySlug,
          related_company_id: relatedId,
        }));

        await supabase.from("related_companies").insert(relatedRows);
      }

      // Insert initial empty stats
      await supabase.from("company_stats").insert({
        company_id: companySlug,
        last_30_days: 0,
        within_3_months: 0,
        within_6_months: 0,
        older_than_6_months: 0,
        easy_count: 0,
        medium_count: 0,
        hard_count: 0,
      });

      return { id: companySlug };
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_EXISTS") {
        return {
          id: slugify(companyData.name!),
          error: `Company with name "${companyData.name}" already exists.`,
          alreadyExists: true,
        };
      }

      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while adding company.";
      Logger.error("Error in addCompany", error, { message });
      return { id: null, error: message };
    }
  }

  /**
   * Update an existing company
   */
  async updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!companyId) {
        return { success: false, error: "Company ID is required" };
      }

      // Security: Use centralized validator to ensure consistency and DRY
      const validation = validateUpdateCompany(companyData);
      if (!validation.success || !validation.data) {
        return { success: false, error: validation.error || "Validation failed" };
      }

      // Security: Sanitize update data (Mass Assignment prevention)
      const updates = sanitizeUpdateData(
        validation.data as unknown as Record<string, unknown>
      );

      // Map camelCase fields to snake_case for Supabase
      const supabaseUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) {supabaseUpdates.name = updates.name;}
      if (updates.normalizedName !== undefined) {supabaseUpdates.normalized_name = updates.normalizedName;}
      if (updates.logo !== undefined) {supabaseUpdates.logo = updates.logo;}
      if (updates.website !== undefined) {supabaseUpdates.website = updates.website;}
      if (updates.description !== undefined) {supabaseUpdates.description = updates.description;}

      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase
          .from("companies")
          .update(supabaseUpdates)
          .eq("id", companyId);

        if (error) {
          throw error;
        }
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while updating company.";
      Logger.error(`Error in updateCompany`, error, { companyId, message });
      return { success: false, error: message };
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    } catch (error) {
      Logger.error(`Error deleting company`, error, { id });
      throw error;
    }
  }

  /**
   * Check if a company exists
   */
  async exists(id: string): Promise<boolean> {
    const company = await this.getCompanyById(id);
    return company !== undefined;
  }
}
