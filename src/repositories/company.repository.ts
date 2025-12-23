import { Company } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  orderBy,
  Timestamp,
  startAfter,
  writeBatch,
  deleteDoc,
  Firestore,
  documentId,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { CompanySchema } from "@/types/schemas";

// Make sure db is initialized
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

export interface GetCompaniesParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  cursor?: string;
}

export interface PaginatedCompaniesResponse {
  companies: Company[];
  totalCompanies?: number;
  totalPages?: number;
  currentPage?: number;
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

function mapFirestoreDocToCompany(
  docSnap: import("firebase/firestore").DocumentSnapshot,
): Company {
  const data = docSnap.data()!;
  const company = {
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

  const validation = CompanySchema.safeParse(company);
  if (!validation.success) {
      console.warn(`[Data Integrity] Invalid company data for ID ${docSnap.id}:`, validation.error.format());
  }

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
    console.error("Failed to decode cursor:", e);
    return null;
  }
}

export class CompanyRepository {
  async getCompanies({
    page = 1,
    pageSize = 30,
    searchTerm,
    cursor,
  }: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    try {
      const normalizedSearchTerm = searchTerm?.trim().toLowerCase();

      // Strategy: Cursor provided (Load More)
      if (cursor) {
        return await this.fetchCompaniesWithCursor(
          pageSize,
          normalizedSearchTerm,
          cursor,
        );
      }

      // Strategy: Standard Page-based Pagination (Optimized)
      const companiesCol = collection(getFirestore(), "companies");
      let queryConstraints: any[] = [
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
      // This avoids reading ALL documents to calculate total count.
      const limitCount = page * pageSize + 1;
      queryConstraints.push(limit(limitCount));
      
      // Ensure consistent sorting with cursor-based query
      if (!searchTerm) {
          queryConstraints.push(orderBy(documentId(), "asc"));
      } else {
          // search query already has orderBy id implicitly added? 
          // No, we must add it explicitely if we want to rely on it for cursor
          queryConstraints.push(orderBy(documentId(), "asc"));
      }

      const q = query(companiesCol, ...queryConstraints);
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      let hasMore = false;
      let companies: Company[] = [];
      const startIndex = (page - 1) * pageSize;

      if (docs.length > page * pageSize) {
          hasMore = true;
      }

      let nextCursor: string | undefined;
      // Slice the results for the current page
      if (docs.length > startIndex) {
        // We take up to pageSize items starting from startIndex
        // The docs array might have up to (page * pageSize + 1) items
        const sliceEnd = Math.min(docs.length, startIndex + pageSize);
        companies = docs.slice(startIndex, sliceEnd).map(mapFirestoreDocToCompany);
        
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
        nextCursor, // Return the generated cursor
      };
    } catch (error) {
      console.error("Error in getCompanies:", error);
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
  ): Promise<{
    companies: Company[];
    nextCursor?: string;
    prevCursor?: string;
    hasMore: boolean;
    hasPrev: boolean;
  }> {
    const companiesCol = collection(getFirestore(), "companies");
    let queryConstraints: any[] = [
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
      prevCursor: undefined,
      hasMore,
      hasPrev: !!cursor,
    };
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    if (!id) return undefined;
    try {
      const companyDocRef = doc(getFirestore(), "companies", id);
      const companySnap = await getDoc(companyDocRef);
      if (companySnap.exists()) {
        return mapFirestoreDocToCompany(companySnap);
      }
      return undefined;
    } catch (error) {
       console.error(`Error fetching company by ID ${id}:`, error);
       return undefined;
    }
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    if (!slug) return undefined;
    try {
        const companyDocRef = doc(getFirestore(), "companies", slug);
        const companySnap = await getDoc(companyDocRef);
        if (companySnap.exists()) {
            return mapFirestoreDocToCompany(companySnap);
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching company by slug ${slug}:`, error);
        return undefined;
    }
  }

  async getAllCompanySlugs(sorted: boolean = true): Promise<string[]> {
    try {
        const companiesCol = collection(getFirestore(), "companies");
        const q = query(companiesCol);
        const companiesSnapshot = await getDocs(q);
        const slugs = companiesSnapshot.docs.map((docSnap) => docSnap.id);
        if (sorted) {
            slugs.sort();
        }
        return slugs;
    } catch (error) {
        console.error("Error fetching all company slugs:", error);
        return [];
    }
  }

  async addCompany(
    companyData: Omit<
      Company,
      | "id"
      | "slug"
      | "problemCount"
      | "difficultyCounts"
      | "recencyCounts"
      | "commonTags"
      | "statsLastUpdatedAt"
    >,
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }> {
    try {
      if (!companyData.name?.trim()) {
        return { id: null, error: "Company name is required" };
      }

      const companySlug = slugify(companyData.name);
      const normalizedName = companyData.name.toLowerCase().trim();

      const existingCompany = await this.getCompanyBySlug(companySlug);
      if (existingCompany) {
        return {
          id: existingCompany.id,
          error: `Company with name "${companyData.name}" already exists.`,
          alreadyExists: true,
        };
      }

      const dataForFirestore: Omit<Company, "id"> = {
        name: companyData.name.trim(),
        normalizedName,
        slug: companySlug,
        logo: companyData.logo,
        description: companyData.description?.trim(),
        website: companyData.website?.trim(),
        problemCount: 0,
        difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
        recencyCounts: {
          last_30_days: 0,
          within_3_months: 0,
          within_6_months: 0,
          older_than_6_months: 0,
        },
        commonTags: [],
        relatedCompanies: companyData.relatedCompanies || [],
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
      console.error("Error in addCompany:", message, error);
      return { id: null, error: message };
    }
  }

  async updateCompany(
    companyId: string,
    companyData: Partial<Company>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!companyId) {
        return { success: false, error: "Company ID is required" };
      }

      const updates: Record<string, any> = { ...companyData };

      if (updates.name) {
        updates.normalizedName = updates.name.toLowerCase().trim();
      }

      delete updates.id;
      delete updates.slug;
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
      console.error(`Error in updateCompany for ${companyId}:`, message, error);
      return { success: false, error: message };
    }
  }

  async bulkDeleteCompanies(
    companyIds: string[],
  ): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
    try {
      if (!companyIds || companyIds.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      const db = getFirestore(); // Use local var to avoid closure issues if any
      const CHUNK_SIZE = 500;

      for (let i = 0; i < companyIds.length; i += CHUNK_SIZE) {
        const chunk = companyIds.slice(i, i + CHUNK_SIZE);
        const currentBatch = writeBatch(db);

        chunk.forEach((id) => {
          const docRef = doc(db, "companies", id);
          currentBatch.delete(docRef);
        });

        await currentBatch.commit();
      }

      return { success: true, deletedCount: companyIds.length };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while bulk deleting companies.";
      console.error(`Error in bulkDeleteCompanies:`, message, error);
      return { success: false, error: message };
    }
  }

  async deleteCompany(
    companyId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!companyId) {
        return { success: false, error: "Company ID is required" };
      }

      const companyDocRef = doc(getFirestore(), "companies", companyId);
      await deleteDoc(companyDocRef);

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while deleting company.";
      console.error(`Error in deleteCompany for ${companyId}:`, message, error);
      return { success: false, error: message };
    }
  }

  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5,
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>> {
    if (!searchTerm || searchTerm.trim().length < 1) {
      return [];
    }
    try {
      const companiesCol = collection(getFirestore(), "companies");
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

      const q = query(
        companiesCol,
        orderBy("normalizedName"),
        where("normalizedName", ">=", lowercasedSearchTerm),
        where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
        limit(limitNum),
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
      console.error("Error fetching company suggestions:", error);
      throw error;
    }
  }
}

export const companyRepository = new CompanyRepository();
