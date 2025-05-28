
import type { Company, LeetCodeProblem, LastAskedPeriod, ProblemStatus, UserProblemStatus } from '@/types';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  limit, 
  addDoc, 
  updateDoc, 
  writeBatch, 
  orderBy, 
  startAt, 
  endAt, 
  getCountFromServer, 
  FieldValue, 
  serverTimestamp, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';
import { unstable_cache } from 'next/cache';

interface GetCompaniesParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

interface PaginatedCompaniesResponse {
  companies: Company[];
  totalCompanies: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Fetches a list of all companies, potentially filtered by a search term.
 * This function is cached.
 * @param {string} [currentSearchTerm] - Optional search term for company name.
 * @returns {Promise<Company[]>} A promise that resolves to an array of companies.
 */
const getCachedFirestoreCompanies = unstable_cache(
  async (currentSearchTerm?: string) => {
    const companiesCol = collection(db, 'companies');
    let q = query(companiesCol, orderBy('normalizedName')); // Default to ordering by normalizedName

    if (currentSearchTerm && currentSearchTerm.trim() !== '') {
      const lowercasedSearchTerm = currentSearchTerm.toLowerCase().trim();
      // Query for names starting with the search term
      q = query(
        companiesCol,
        orderBy('normalizedName'),
        where('normalizedName', '>=', lowercasedSearchTerm),
        where('normalizedName', '<=', lowercasedSearchTerm + '\uf8ff')
      );
    }
    
    const querySnapshot = await getDocs(q);
    console.log(`Firestore read for companies list (searchTerm: ${currentSearchTerm || 'all'}, orderBy: normalizedName)`);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Company));
  },
  ['firestore-companies-list-with-optional-search'], // Unique key for this cache
  {
    tags: ['companies-collection-broad'], // Tag for revalidation
    revalidate: 3600 // Revalidate every hour as a fallback
  }
);

/**
 * Fetches a paginated list of companies, allowing for searching by name or description.
 * Uses server-side caching for the initial company list fetch.
 * @param {GetCompaniesParams} [params] - Parameters for pagination and searching.
 * @returns {Promise<PaginatedCompaniesResponse>} A promise resolving to paginated company data.
 */
export const getCompanies = async ({ page = 1, pageSize = 9, searchTerm }: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> => {
  try {
    // Fetch the base list (potentially filtered by name prefix server-side via cache)
    let baseCompaniesList = await getCachedFirestoreCompanies(searchTerm?.trim());
    let filteredCompanies = [...baseCompaniesList]; // Create a mutable copy

    // If searchTerm is provided, and we also want to search description, apply secondary client-side filter.
    // The primary name filter (prefix match) is handled by getCachedFirestoreCompanies.
    if (searchTerm && searchTerm.trim() !== '') {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      filteredCompanies = filteredCompanies.filter(company =>
        // Name already pre-filtered by getCachedFirestoreCompanies if searchTerm was passed to it.
        // This adds description search on the potentially pre-filtered results.
        (company.description && company.description.toLowerCase().includes(lowercasedSearchTerm)) ||
        // If getCachedFirestoreCompanies was called without searchTerm, then name check is needed here.
        (!currentSearchTermWasPassedToCache(searchTerm) && company.normalizedName && company.normalizedName.includes(lowercasedSearchTerm))
      );
    }
    
    // Helper to determine if getCachedFirestoreCompanies was called with a search term
    // This is to avoid redundant name filtering if already done server-side.
    function currentSearchTermWasPassedToCache(currentSearchTerm?: string): boolean {
        return !!(currentSearchTerm && currentSearchTerm.trim() !== '');
    }

    const totalCompanies = filteredCompanies.length;
    const totalPages = Math.ceil(totalCompanies / pageSize) || 1;
    const currentPageResult = Math.min(Math.max(1, page), totalPages); // Ensure page is within bounds
    const startIndex = (currentPageResult - 1) * pageSize;
    const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + pageSize);

    return {
      companies: paginatedCompanies,
      totalCompanies,
      totalPages,
      currentPage: currentPageResult,
    };
  } catch (error) {
    console.error("Error fetching companies: ", error);
    return { companies: [], totalCompanies: 0, totalPages: 1, currentPage: 1 };
  }
};

/**
 * Fetches a single company by its ID. Results are cached.
 * @param {string} id - The ID of the company to fetch.
 * @returns {Promise<Company | undefined>} A promise resolving to the company data or undefined if not found.
 */
export const getCompanyById = async (id: string): Promise<Company | undefined> => {
  const getCachedCompany = unstable_cache(
    async (companyId: string) => {
      if (!companyId) return undefined;
      const companyDocRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyDocRef);
      console.log(`Firestore read for company-detail-${companyId}`);
      if (companySnap.exists()) return { id: companySnap.id, ...companySnap.data() } as Company;
      return undefined;
    },
    ['company-by-id-cache-key'], // Cache key namespace
    { tags: (companyId: string) => [`company-detail-${companyId}`], revalidate: 3600 }
  );
  try { return await getCachedCompany(id); }
  catch (error) { console.error(`Error fetching company ${id}: `, error); return undefined; }
};

/**
 * Fetches all LeetCode problems associated with a specific company ID. Results are cached.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<LeetCodeProblem[]>} A promise resolving to an array of problems.
 */
export const getProblemsByCompany = async (companyId: string): Promise<LeetCodeProblem[]> => {
  const getCachedProblemsForCompany = unstable_cache(
    async (compId: string) => {
      if (!compId) return [];
      const problemsCol = collection(db, 'problems');
      const q = query(problemsCol, where('companyId', '==', compId), orderBy('title'));
      const problemSnapshot = await getDocs(q);
      console.log(`Firestore read for problems-for-company-${compId}`);
      return problemSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as LeetCodeProblem));
    },
    ['problems-by-company-id-cache-key'],
    { tags: (compId: string) => [`problems-for-company-${compId}`, 'problems-collection-broad'], revalidate: 3600 }
  );
  try { return await getCachedProblemsForCompany(companyId); }
  catch (error) { console.error(`Error fetching problems for company ${companyId}: `, error); return []; }
};

/**
 * Fetches all LeetCode problems from the database. Results are cached.
 * @returns {Promise<LeetCodeProblem[]>} A promise resolving to an array of all problems.
 */
export const getAllProblems = async (): Promise<LeetCodeProblem[]> => {
  const getCachedAllProblemsList = unstable_cache(
    async () => {
      const problemsCol = collection(db, 'problems');
      const q = query(problemsCol, orderBy('title'));
      const problemSnapshot = await getDocs(q);
      console.log('Firestore read for all-problems-list');
      return problemSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as LeetCodeProblem));
    },
    ['all-problems-list-unique-cache-key'],
    { tags: ['problems-collection-broad'], revalidate: 3600 }
  );
  try { return await getCachedAllProblemsList(); }
  catch (error) { console.error(`Error fetching all problems: `, error); return []; }
};

/**
 * Fetches a single LeetCode problem by its ID. Results are cached.
 * @param {string} id - The ID of the problem to fetch.
 * @returns {Promise<LeetCodeProblem | undefined>} A promise resolving to the problem data or undefined if not found.
 */
export const getProblemById = async (id: string): Promise<LeetCodeProblem | undefined> => {
  const getCachedProblem = unstable_cache(
    async (problemId: string) => {
      if (!problemId) {
          console.warn("getCachedProblem called with undefined or empty id");
          return undefined;
      }
      const problemDocRef = doc(db, 'problems', problemId);
      const problemSnap = await getDoc(problemDocRef);
      console.log(`Firestore read for problem-detail-${problemId}`);
      if (problemSnap.exists()) {
        return { id: problemSnap.id, ...problemSnap.data() } as LeetCodeProblem;
      }
      console.warn(`Problem with id ${problemId} not found in Firestore.`);
      return undefined;
    },
    ['problem-by-id-cache-key'],
    { tags: (problemId: string) => [`problem-detail-${problemId}`, 'problems-collection-broad'], revalidate: 3600 }
  );
  try {
    return await getCachedProblem(id);
  } catch (error) {
    console.error(`Error fetching problem ${id}: `, error);
    return undefined;
  }
};

/**
 * Adds a new problem to Firestore or updates an existing one (based on title and companyId).
 * @param {Omit<LeetCodeProblem, 'id'>} problemData - Data of the problem to add/update.
 * @returns {Promise<{ id: string | null; updated: boolean; error?: string }>} Object with new/existing problem ID, update status, and optional error.
 */
export const addProblemToDb = async (problemData: Omit<LeetCodeProblem, 'id'>): Promise<{ id: string | null; updated: boolean; error?: string }> => {
  try {
    const problemsCol = collection(db, 'problems');
    const problemTitleLower = problemData.normalizedTitle; // Assume normalizedTitle is passed in
    
    // Query for existing problem with the same normalized title and company ID
    const q = query(
      problemsCol, 
      where('companyId', '==', problemData.companyId), 
      where('normalizedTitle', '==', problemTitleLower), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Problem exists, update its lastAskedPeriod
      const existingProblemDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'problems', existingProblemDoc.id), { 
        lastAskedPeriod: problemData.lastAskedPeriod 
        // Potentially update other fields if needed, e.g., tags, link, if they can change
      });
      console.log(`Updated existing problem: ${existingProblemDoc.id}`);
      return { id: existingProblemDoc.id, updated: true };
    } else {
      // Problem doesn't exist, add it
      const docRef = await addDoc(problemsCol, problemData); // problemData already includes normalizedTitle
      console.log(`Added new problem: ${docRef.id}`);
      return { id: docRef.id, updated: false };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while saving problem.";
    console.error("Error adding/updating problem in Firestore: ", error);
    return { id: null, updated: false, error: message };
  }
};

/**
 * Adds a new company to Firestore.
 * @param {Omit<Company, 'id'>} companyData - Data of the company to add.
 * @returns {Promise<{ id: string | null; error?: string }>} Object with new company ID and optional error.
 */
export const addCompanyToDb = async (companyData: Omit<Company, 'id'>): Promise<{ id: string | null; error?: string }> => {
  try {
    const companiesCol = collection(db, 'companies');
    // Ensure normalizedName is present, defaulting to lowercase name if not provided
    const dataForFirestore: Omit<Company, 'id'> = { 
        ...companyData,
        normalizedName: companyData.normalizedName || companyData.name.toLowerCase() 
    };
    // Remove fields that are undefined to avoid Firestore errors
    if (companyData.logo === undefined) delete (dataForFirestore as Partial<Company>).logo;
    if (companyData.description === undefined) delete (dataForFirestore as Partial<Company>).description;
    if (companyData.website === undefined) delete (dataForFirestore as Partial<Company>).website;


    const docRef = await addDoc(companiesCol, dataForFirestore);
    console.log(`Added new company: ${docRef.id}`);
    return { id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while adding company.";
    console.error("Error adding company to Firestore: ", error);
    return { id: null, error: message };
  }
};

/**
 * Checks if the database contains any companies or problems.
 * This is a lightweight check using limit(1).
 * @returns {Promise<{ companies: boolean, problems: boolean }>} Status of data presence.
 */
export const hasData = async (): Promise<{ companies: boolean, problems: boolean }> => {
  try {
    const companiesSnap = await getDocs(query(collection(db, 'companies'), limit(1)));
    const problemsSnap = await getDocs(query(collection(db, 'problems'), limit(1)));
    return { companies: !companiesSnap.empty, problems: !problemsSnap.empty };
  } catch (error) { 
    console.error("Error checking for data presence: ", error); 
    return { companies: false, problems: false }; 
  }
};

// --- Bookmark Functions ---
/**
 * Toggles a problem's bookmark status for a user in Firestore.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem.
 * @returns {Promise<{ isBookmarked: boolean; error?: string }>} New bookmark state and optional error.
 */
export const dbToggleBookmarkProblem = async (userId: string, problemId: string): Promise<{ isBookmarked: boolean; error?: string }> => {
  if (!userId || !problemId) return { isBookmarked: false, error: 'User ID and Problem ID are required.' };
  const bookmarkDocRef = doc(db, 'users', userId, 'bookmarkedProblems', problemId);
  try {
    const docSnap = await getDoc(bookmarkDocRef);
    if (docSnap.exists()) {
      await deleteDoc(bookmarkDocRef); 
      console.log(`Unbookmarked problem ${problemId} for user ${userId}`);
      return { isBookmarked: false };
    } else {
      await setDoc(bookmarkDocRef, { bookmarkedAt: serverTimestamp() }); 
      console.log(`Bookmarked problem ${problemId} for user ${userId}`);
      return { isBookmarked: true };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while toggling bookmark.';
    console.error('Error toggling bookmark in Firestore:', error);
    return { isBookmarked: false, error: message };
  }
};

/**
 * Retrieves all bookmarked problem IDs for a user from Firestore.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string[]>} An array of bookmarked problem IDs.
 */
export const dbGetUserBookmarkedProblemIds = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'users', userId, 'bookmarkedProblems'), orderBy('bookmarkedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => docSnap.id);
  } catch (error) { 
    console.error(`Error fetching bookmarked problem IDs for user ${userId}:`, error); 
    return []; 
  }
};

// --- Problem Progress Tracking Functions ---
/**
 * Sets or clears a problem's progress status for a user in Firestore.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem.
 * @param {ProblemStatus} status - The new status ('solved', 'attempted', 'todo', or 'none' to clear).
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export const dbSetProblemStatus = async (
  userId: string,
  problemId: string,
  status: ProblemStatus
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !problemId) return { success: false, error: 'User ID and Problem ID are required.' };
  const statusDocRef = doc(db, 'users', userId, 'problemProgress', problemId);
  try {
    if (status === 'none') {
      await deleteDoc(statusDocRef);
      console.log(`Cleared status for problem ${problemId} for user ${userId}`);
    } else {
      await setDoc(statusDocRef, { status: status, updatedAt: serverTimestamp() });
      console.log(`Set status to ${status} for problem ${problemId} for user ${userId}`);
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update problem status.';
    console.error('Error setting problem status in Firestore:', error);
    return { success: false, error: message };
  }
};

/**
 * Retrieves all problem progress statuses for a user from Firestore.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Record<string, ProblemStatus>>} A map of problem IDs to their statuses.
 */
export const dbGetAllUserProblemStatuses = async (userId: string): Promise<Record<string, ProblemStatus>> => {
  if (!userId) return {};
  const statuses: Record<string, ProblemStatus> = {};
  try {
    const progressColRef = collection(db, 'users', userId, 'problemProgress');
    const q = query(progressColRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status) { 
        statuses[docSnap.id] = data.status as ProblemStatus;
      }
    });
    return statuses;
  } catch (error) {
    console.error(`Error fetching all problem statuses for user ${userId}:`, error);
    return {}; 
  }
};

// --- User Profile Update Functions ---
/**
 * Updates a user's display name in their Firestore profile document.
 * @param {string} userId - The ID of the user.
 * @param {string} newDisplayName - The new display name.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export const dbUpdateUserDisplayName = async (
  userId: string,
  newDisplayName: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId) return { success: false, error: 'User ID is required.' };
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters.' };
  }
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, { displayName: newDisplayName.trim() });
    console.log(`Updated display name for user ${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update display name in Firestore.';
    console.error('Error updating user display name in Firestore:', error);
    return { success: false, error: message };
  }
};
