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
  runTransaction,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
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

      // Security: Use transaction to prevent race conditions (TOCTOU)
      await runTransaction(getFirestore(), async (transaction) => {
        const companiesCol = collection(getFirestore(), "companies");
        const docRef = doc(companiesCol, companySlug);

        // Check existence inside transaction
        const docSnap = await transaction.get(docRef);

        if (docSnap.exists()) {
          throw new Error("ALREADY_EXISTS");
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

        transaction.set(docRef, dataForFirestore);
      });

      return { id: companySlug };
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_EXISTS") {
        return {
          // slugify(safeData.name) would be same as companySlug but safeData is not in scope here if define inside try?
          // Wait, safeData is defined before try in original code? No, inside try.
          // In my replacement block above, I need to ensure companySlug is available.
          // Ah, I am replacing the whole block including variable declarations.
          // BUT the catch block is closing the function's try/catch.
          // In the original code, `try` wraps EVERYTHING.
          // So `safeData` is defined INSIDE the `try` block.
          // If I throw "ALREADY_EXISTS", I am in the catch block.
          // I can access `companyData.name` but not `safeData` or `companySlug` easily if they were defined inside try.
          // However, I can re-slugify `companyData.name`.
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
