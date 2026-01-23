/**
 * Company CRUD Operations Module
 * Handles create, read, update, delete operations for companies
 */

import type { DocumentSnapshot, Firestore } from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/api/firebase";
import { slugify } from "@/lib/utils";
import { Logger } from "@/lib/utils/logger";
import type { Company } from "@/types";
import { CompanySchema } from "@/types";

import type {
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../../interfaces/company.repository.interface";

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
 * Get Firestore instance with validation
 */
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration."
    );
  }
  return db;
}

/**
 * Map Firestore document to Company object
 */
export function mapFirestoreDocToCompany(docSnap: DocumentSnapshot): Company {
  const data = docSnap.data()!;
  const company: Company = {
    id: docSnap.id,
    slug: data.slug || docSnap.id || slugify(data.name || ""),
    name: data.name || docSnap.id.charAt(0).toUpperCase() + docSnap.id.slice(1),
    normalizedName:
      data.normalizedName ||
      data.name?.toLowerCase() ||
      docSnap.id.toLowerCase(),
    logo: data.logo,
    description: data.description,
    website: data.website,
    problemCount: data.problemCount || 0,
    difficultyCounts: data.difficultyCounts || {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    },
    recencyCounts: data.recencyCounts || {
      last_30_days: 0,
      within_3_months: 0,
      within_6_months: 0,
      older_than_6_months: 0,
    },
    commonTags: data.commonTags || [],
    relatedCompanies: data.relatedCompanies || [],
    statsLastUpdatedAt:
      data.statsLastUpdatedAt instanceof Timestamp
        ? data.statsLastUpdatedAt.toDate()
        : undefined,
  };

  return company;
}

/**
 * Company CRUD Operations Implementation
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
      const companyDocRef = doc(getFirestore(), "companies", id);
      const companySnap = await getDoc(companyDocRef);
      if (companySnap.exists()) {
        return mapFirestoreDocToCompany(companySnap);
      }
      return undefined;
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
      const companyDocRef = doc(getFirestore(), "companies", slug);
      const companySnap = await getDoc(companyDocRef);
      if (companySnap.exists()) {
        return mapFirestoreDocToCompany(companySnap);
      }
      return undefined;
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
      const companiesCol = collection(getFirestore(), "companies");
      // Security: Limit to prevent DoS on bulk retrieval
      const q = query(companiesCol, limit(MAX_ALL_SLUGS_LIMIT));
      const companiesSnapshot = await getDocs(q);
      const slugs = companiesSnapshot.docs.map((docSnap) => docSnap.id);
      if (sorted) {
        slugs.sort();
      }
      return slugs;
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
      if (!companyData.name?.trim()) {
        return { id: null, error: "Company name is required" };
      }

      // Pre-validate input using Zod (partial schema since some fields are auto-generated)
      const PartialCompanySchema = CompanySchema.pick({
        name: true,
        logo: true,
        description: true,
        website: true,
        relatedCompanies: true,
      });

      const validation = PartialCompanySchema.safeParse(companyData);
      if (!validation.success) {
        return { id: null, error: validation.error.issues[0].message };
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

      const existingCompany = await this.getCompanyBySlug(companySlug);
      if (existingCompany) {
        return {
          id: existingCompany.id,
          error: `Company with name "${safeData.name}" already exists.`,
          alreadyExists: true,
        };
      }

      const dataForFirestore: Omit<Company, "id"> = {
        name: safeData.name.trim(),
        normalizedName,
        slug: companySlug,
        logo: safeData.logo,
        description: safeData.description?.trim(),
        website: safeData.website?.trim(),
        problemCount: 0,
        difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
        recencyCounts: {
          last_30_days: 0,
          within_3_months: 0,
          within_6_months: 0,
          older_than_6_months: 0,
        },
        commonTags: [],
        relatedCompanies: safeData.relatedCompanies || [],
        statsLastUpdatedAt: undefined,
      };

      // Clean up undefined values
      Object.keys(dataForFirestore).forEach((key) => {
        if (
          dataForFirestore[key as keyof typeof dataForFirestore] === undefined
        ) {
          delete dataForFirestore[key as keyof typeof dataForFirestore];
        }
      });

      const companiesCol = collection(getFirestore(), "companies");
      const docRef = doc(companiesCol, companySlug);
      await setDoc(docRef, dataForFirestore);

      return { id: companySlug };
    } catch (error) {
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

      // Validate input using Zod (partial schema)
      // This protects against invalid data types and malicious inputs (e.g. javascript: URLs)
      const validation = CompanySchema.partial().safeParse(companyData);
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
      }

      // Security: Use validated data to strip unknown fields (Mass Assignment prevention)
      const updates: Record<string, unknown> = { ...validation.data };

      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.slug;
      delete updates.normalizedName;

      if (updates.name && typeof updates.name === "string") {
        updates.normalizedName = updates.name.toLowerCase().trim();
      }

      // Security: Prevent Mass Assignment of computed/readonly fields
      // These fields should only be updated by the system (e.g., ProblemRepository)
      delete updates.problemCount;
      delete updates.difficultyCounts;
      delete updates.recencyCounts;
      delete updates.commonTags;
      delete updates.statsLastUpdatedAt;

      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const companyDocRef = doc(getFirestore(), "companies", companyId);
      await updateDoc(companyDocRef, updates);

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
      const companyDocRef = doc(getFirestore(), "companies", id);
      await deleteDoc(companyDocRef);
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
