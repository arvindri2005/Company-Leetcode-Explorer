import type { DocumentSnapshot } from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  type Firestore,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryConstraint,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type { Company as CompanyEntity } from "@/domain/entities/company.entity";
import { db } from "@/lib/api/firebase";
import { slugify } from "@/lib/utils";
import { Logger } from "@/lib/utils/logger";
import type { PaginatedResult } from "@/shared/interfaces";
import { type Company, CompanySchema } from "@/types";

import type {
  CreateCompanyDTO,
  GetCompaniesParams,
  ICompanyRepository,
  PaginatedCompaniesResponse,
  UpdateCompanyDTO,
} from "../interfaces/company.repository.interface";

const MAX_PAGE_SIZE = 50;
const MAX_OFFSET_LIMIT = 2000;
const MAX_SUGGESTION_LIMIT = 20;
const MAX_ALL_SLUGS_LIMIT = 10000;
const MAX_SEARCH_TERM_LENGTH = 100;

// Make sure db is initialized
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

function mapFirestoreDocToCompany(
  docSnap: DocumentSnapshot,
): Company {
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

// Helper to encode cursor
function encodeCursor(data: { normalizedName: string; id: string }): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

// Helper to decode cursor
function decodeCursor(
  cursor: string,
): { normalizedName: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch (e) {
    Logger.error("Failed to decode cursor", e);
    return null;
  }
}

export class CompanyRepository implements ICompanyRepository {
  // ============================================
  // IBaseRepository implementation
  // ============================================

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await this.getCompanyById(id);
    // Note: We return null for interface compliance
    // The actual domain entity conversion would happen in the service layer
    return company ? (company as unknown as CompanyEntity) : null;
  }

  async findAll(params?: { cursor?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<CompanyEntity>> {
    const result = await this.getCompanies(params);
    return {
      items: result.companies as unknown as CompanyEntity[],
      totalItems: result.totalCompanies,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  }

  async save(data: CreateCompanyDTO): Promise<CompanyEntity> {
    const result = await this.addCompany(data);
    if (!result.id) {
      throw new Error(result.error || "Failed to create company");
    }
    const company = await this.getCompanyById(result.id);
    if (!company) {
      throw new Error("Failed to retrieve created company");
    }
    return company as unknown as CompanyEntity;
  }

  async update(id: string, data: UpdateCompanyDTO): Promise<CompanyEntity> {
    const result = await this.updateCompany(id, data);
    if (!result.success) {
      throw new Error(result.error || "Failed to update company");
    }
    const company = await this.getCompanyById(id);
    if (!company) {
      throw new Error("Failed to retrieve updated company");
    }
    return company as unknown as CompanyEntity;
  }

  async delete(id: string): Promise<void> {
    try {
      const companyDocRef = doc(getFirestore(), "companies", id);
      await deleteDoc(companyDocRef);
    } catch (error) {
      Logger.error(`Error deleting company`, error, { id });
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const company = await this.getCompanyById(id);
    return company !== undefined;
  }

  // ============================================
  // ICompanyRepository specific methods
  // ============================================

  async getCompanies({
    page = 1,
    pageSize = 30,
    searchTerm,
    cursor,
  }: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    try {
      // Security: Sanitize and limit search term length
      const normalizedSearchTerm = searchTerm
        ?.trim()
        .slice(0, MAX_SEARCH_TERM_LENGTH)
        .toLowerCase();

      // Security: Clamp page size to prevent large reads
      const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);

      // Strategy: Cursor provided (Load More)
      if (cursor) {
        return await this.fetchCompaniesWithCursor(
          safePageSize,
          normalizedSearchTerm,
          cursor,
        );
      }

      // Security: Prevent deep pagination DoS
      if (page * safePageSize > MAX_OFFSET_LIMIT) {
        throw new Error(
          `Pagination limit exceeded. Please refine your search or use filters.`,
        );
      }

      // Strategy: Standard Page-based Pagination (Optimized)
      const companiesCol = collection(getFirestore(), "companies");
      let queryConstraints: QueryConstraint[] = [
        orderBy("normalizedName", "asc"),
      ];

      if (normalizedSearchTerm) {
        queryConstraints = [
          where("normalizedName", ">=", normalizedSearchTerm),
          where("normalizedName", "<=", normalizedSearchTerm + "\uf8ff"),
          orderBy("normalizedName", "asc"),
        ];
      }

      // Calculate limit to fetch enough for the current page + 1 (to check hasMore)
      const limitCount = page * safePageSize + 1;
      queryConstraints.push(limit(limitCount));

      // Ensure consistent sorting with cursor-based query
      queryConstraints.push(orderBy(documentId(), "asc"));

      const q = query(companiesCol, ...queryConstraints);
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      let hasMore = false;
      let companies: Company[] = [];
      const startIndex = (page - 1) * safePageSize;

      if (docs.length > page * safePageSize) {
        hasMore = true;
      }

      let nextCursor: string | undefined;
      // Slice the results for the current page
      if (docs.length > startIndex) {
        const sliceEnd = Math.min(docs.length, startIndex + safePageSize);
        companies = docs
          .slice(startIndex, sliceEnd)
          .map(mapFirestoreDocToCompany);
        
        // Generate cursor for the last item if we have more
        if (hasMore && companies.length > 0) {
            const lastCompany = companies[companies.length - 1];
            nextCursor = encodeCursor({
                normalizedName: lastCompany.normalizedName || "",
                id: lastCompany.id,
            });
        }
      } else {
        companies = [];
      }
      
      return {
        companies,
        totalCompanies: -1, // Unknown total to save reads
        totalPages: -1,     // Unknown pages to save reads
        currentPage: page,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      Logger.error("Error in getCompanies", error);
      return {
        companies: [],
        hasMore: false,
        currentPage: 1,
        totalPages: 1,
        totalCompanies: 0,
      };
    }
  }

  private async fetchCompaniesWithCursor(
    pageSize: number,
    searchTerm?: string,
    cursor?: string,
  ): Promise<PaginatedCompaniesResponse> {
    const companiesCol = collection(getFirestore(), "companies");
    let queryConstraints: QueryConstraint[] = [
      orderBy("normalizedName", "asc"),
      orderBy(documentId(), "asc"),
      limit(pageSize + 1),
    ];

    if (searchTerm && searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      queryConstraints = [
        where("normalizedName", ">=", lowercasedSearchTerm),
        where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
        orderBy("normalizedName", "asc"),
        orderBy(documentId(), "asc"),
        limit(pageSize + 1),
      ];
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        queryConstraints.push(startAfter(decoded.normalizedName, decoded.id));
      }
    }

    const queryBuilder = query(companiesCol, ...queryConstraints);
    const querySnapshot = await getDocs(queryBuilder);
    const docs = querySnapshot.docs;
    const hasMore = docs.length > pageSize;

    const companies = docs.slice(0, pageSize).map(mapFirestoreDocToCompany);

    let nextCursor: string | undefined;
    if (hasMore && companies.length > 0) {
      const lastCompany = companies[companies.length - 1];
      nextCursor = encodeCursor({
        normalizedName: lastCompany.normalizedName || "",
        id: lastCompany.id,
      });
    }

    return {
      companies,
      nextCursor,
      hasMore,
      totalCompanies: -1,
    };
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) {return undefined;}
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

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    if (!slug) {return undefined;}
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

  async addCompany(
    companyData: CreateCompanyDTO,
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

  async updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO,
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

  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5,
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>> {
    const sanitizedTerm = searchTerm
      ?.trim()
      .slice(0, MAX_SEARCH_TERM_LENGTH)
      .toLowerCase();

    if (!sanitizedTerm || sanitizedTerm.length < 1) {
      return [];
    }
    try {
      // Security: Clamp limit
      const safeLimit = Math.min(limitNum, MAX_SUGGESTION_LIMIT);

      const companiesCol = collection(getFirestore(), "companies");

      const q = query(
        companiesCol,
        orderBy("normalizedName"),
        where("normalizedName", ">=", sanitizedTerm),
        where("normalizedName", "<=", sanitizedTerm + "\uf8ff"),
        limit(safeLimit),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          slug: data.slug || slugify(data.name),
          logo: data.logo,
        } as Pick<Company, "id" | "name" | "slug" | "logo">;
      });
    } catch (error) {
      Logger.error("Error fetching company suggestions", error);
      throw error;
    }
  }
}

export const companyRepository = new CompanyRepository();
