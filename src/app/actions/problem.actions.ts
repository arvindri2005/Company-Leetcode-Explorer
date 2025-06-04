
'use server';

import type { LeetCodeProblem, LastAskedPeriod, PaginatedProblemsResponse, ProblemListFilters, UserProblemStatusInfo, BookmarkedProblemInfo } from '@/types';
import { lastAskedPeriodOptions } from '@/types';
import { addProblemToDb, getProblemDetailsFromDb, getCompanyById, getProblemsByCompanyFromDb, dbGetUserBookmarkedProblemsInfo, dbGetAllUserProblemStatuses } from '@/lib/data';
import { revalidatePath, revalidateTag } from 'next/cache';
import { slugify } from '@/lib/utils';

/**
 * Adds a new LeetCode problem to the database.
 * If a problem with the same title and companyId already exists, it updates the lastAskedPeriod.
 * @param {Omit<LeetCodeProblem, 'id' | 'normalizedTitle' | 'companySlug' | 'slug'>} problemDataInput - The data for the problem to add.
 * @returns {Promise<{ success: boolean; data?: LeetCodeProblem; updated?: boolean; error?: string }>} Result of the operation.
 */
export async function addProblem(
  problemDataInput: Omit<LeetCodeProblem, 'id' | 'normalizedTitle' | 'companySlug' | 'slug'>
): Promise<{ success: boolean; data?: LeetCodeProblem; updated?: boolean; error?: string }> {
  try {
    const problemData = {
      ...problemDataInput,
      normalizedTitle: problemDataInput.title.toLowerCase(),
    };

    if (!problemData.title || !problemData.difficulty || !problemData.link || !problemData.companyId || !problemData.lastAskedPeriod) {
      return { success: false, error: 'Missing required fields for problem submission (Title, Difficulty, Link, Company, Last Asked Period).' };
    }
    if (!problemData.link.startsWith('http://') && !problemData.link.startsWith('https://')) {
      return { success: false, error: 'Invalid problem link format. Must start with http:// or https://.' };
    }

    const company = await getCompanyById(problemData.companyId);
    if (!company) {
      return { success: false, error: `Company with ID ${problemData.companyId} not found.` };
    }

    // Tags are now optional, so `problemData.tags.length === 0` is a valid state
    // and not considered a missing required field. The problemData.tags will be an empty array if no tags were provided.

    const { id: problemId, updated, error: dbError } = await addProblemToDb(problemData.companyId, problemData);

    if (dbError || !problemId) {
      return { success: false, error: dbError || 'Failed to save problem to the database.' };
    }

    revalidateTag('problems-collection-broad');
    revalidateTag(`problems-for-company-${problemData.companyId}`);
    revalidateTag(`company-detail-${problemData.companyId}`);
    revalidateTag(`company-slug-${company.slug}`);
    revalidatePath(`/company/${company.slug}`);
    ['/', '/submit-problem'].forEach(p => revalidatePath(p));

    return { success: true, data: { ...problemData, id: problemId, slug: slugify(problemData.title), companySlug: company.slug }, updated };
  } catch (error) {
    console.error('Error adding problem (action level):', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while adding the problem.' };
  }
}


interface RawExcelProblemData { title: string; difficulty: string; link: string; tags: string; companyName: string; lastAskedPeriod: LastAskedPeriod; }
interface BulkAddDetailedResult { rowIndex: number; title: string; status: 'added' | 'updated' | 'error'; message: string; }

/**
 * Adds multiple LeetCode problems from an Excel sheet.
 * @param {RawExcelProblemData[]} problemsFromExcel - Array of raw problem data parsed from Excel.
 * @returns {Promise<{ addedCount: number; updatedCount: number; errorCount: number; detailedResults: BulkAddDetailedResult[] }>} Summary and detailed results of the bulk operation.
 */
export async function bulkAddProblems(
  problemsFromExcel: RawExcelProblemData[]
): Promise<{ addedCount: number; updatedCount: number; errorCount: number; detailedResults: BulkAddDetailedResult[] }> {
  let added = 0, updated = 0, errors = 0;
  const detailedResults: BulkAddDetailedResult[] = [];
  const affectedCompanySlugs = new Set<string>();
  const affectedCompanyIds = new Set<string>();

  const { getCompanies: getAllCompaniesFromDbInternal } = await import('@/lib/data');
  const companiesData = await getAllCompaniesFromDbInternal({ pageSize: 100000 });
  const companyMap = new Map(companiesData.companies.map(c => [c.normalizedName || c.name.toLowerCase(), { id: c.id, slug: c.slug }]));
  const validLastAskedPeriods = lastAskedPeriodOptions.map(opt => opt.value);

  for (let i = 0; i < problemsFromExcel.length; i++) {
    const raw = problemsFromExcel[i];
    const title = String(raw.title || '').trim();
    if (!title) { errors++; detailedResults.push({ rowIndex: i, title: '(No Title)', status: 'error', message: 'Missing problem title.' }); continue; }

    const companyName = String(raw.companyName || '').trim();
    if (!companyName) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: 'Missing company name.' }); continue; }

    const companyInfo = companyMap.get(companyName.toLowerCase());
    if (!companyInfo || !companyInfo.id || !companyInfo.slug) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Company "${companyName}" not found in database.` }); continue; }
    const companyId = companyInfo.id;
    const companySlug = companyInfo.slug;

    let difficulty: 'Easy' | 'Medium' | 'Hard' | undefined;
    const diffLower = String(raw.difficulty || '').trim().toLowerCase();
    if (diffLower === 'easy') difficulty = 'Easy';
    else if (diffLower === 'medium') difficulty = 'Medium';
    else if (diffLower === 'hard') difficulty = 'Hard';
    if (!difficulty) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Invalid or missing difficulty: "${raw.difficulty}". Must be Easy, Medium, or Hard.` }); continue; }

    const link = String(raw.link || '').trim();
    if (!link.startsWith('http')) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: 'Invalid problem link. Must start with http:// or https://.' }); continue; }
    try { new URL(link); } catch { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Malformed problem link: ${link}`}); continue; }

    const tags = String(raw.tags || '').trim().split(',').map(t => t.trim()).filter(Boolean);
    // Tags can now be empty, so no error check for tags.length === 0

    const lastAskedPeriod = String(raw.lastAskedPeriod || '').trim() as LastAskedPeriod;
    if (!validLastAskedPeriods.includes(lastAskedPeriod)) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Invalid Last Asked Period: "${lastAskedPeriod}". Valid options: ${validLastAskedPeriods.join(', ')}.` }); continue; }

    const result = await addProblemToDb(companyId, { title, difficulty, link, tags, lastAskedPeriod, normalizedTitle: title.toLowerCase() });
    if (result.id) {
      if (result.updated) { updated++; detailedResults.push({ rowIndex: i, title, status: 'updated', message: 'Updated existing problem.' }); }
      else { added++; detailedResults.push({ rowIndex: i, title, status: 'added', message: 'Added new problem.' }); }
      affectedCompanySlugs.add(companySlug);
      affectedCompanyIds.add(companyId);
    } else { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: result.error || 'Database error occurred.' }); }
  }

  if (added > 0 || updated > 0) {
    revalidateTag('problems-collection-broad');
    revalidateTag('companies-collection-broad');
    affectedCompanySlugs.forEach(slug => revalidateTag(`company-slug-${slug}`));
    affectedCompanyIds.forEach(id => revalidateTag(`company-detail-${id}`));
    affectedCompanyIds.forEach(id => revalidateTag(`problems-for-company-${id}`));

    ['/', '/submit-problem', '/bulk-add-problems', '/companies'].forEach(p => revalidatePath(p));
    affectedCompanySlugs.forEach(slug => revalidatePath(`/company/${slug}`));
  }

  return { addedCount: added, updatedCount: updated, errorCount: errors, detailedResults };
}

/**
 * Fetches full details for a batch of problem IDs, belonging to specific companies.
 * @param {Array<{problemId: string, companyId: string}>} problemRefs - An array of objects containing problemId and companyId.
 * @returns {Promise<LeetCodeProblem[]>} An array of LeetCodeProblem objects. Returns empty if input is empty or on error.
 */
export async function getProblemDetailsBatchAction(problemRefs: Array<{problemId: string, companyId: string}>): Promise<LeetCodeProblem[]> {
  if (!problemRefs || problemRefs.length === 0) return [];
  try {
    const problems = await Promise.all(
        problemRefs.map(ref => getProblemDetailsFromDb(ref.companyId, ref.problemId))
    );
    return problems.filter(Boolean) as LeetCodeProblem[];
  } catch (error) {
    console.error('Error in getProblemDetailsBatchAction:', error);
    return [];
  }
}

/**
 * Fetches a paginated and filtered list of problems for a company,
 * augmenting with user-specific data if userId is provided.
 */
export async function fetchProblemsForCompanyPage(params: {
  companyId: string;
  page: number;
  pageSize: number;
  filters: ProblemListFilters;
  userId?: string;
}): Promise<PaginatedProblemsResponse | { error: string }> {
  try {
    const { companyId, page, pageSize, filters, userId } = params;

    const paginatedResult = await getProblemsByCompanyFromDb(companyId, {
      page,
      pageSize,
      difficultyFilter: filters.difficultyFilter,
      lastAskedFilter: filters.lastAskedFilter,
      searchTerm: filters.searchTerm,
      sortKey: filters.sortKey,
    });

    if (!userId) {
      return paginatedResult; // Return as is if no user context
    }

    // Fetch user-specific data
    let userBookmarks: BookmarkedProblemInfo[] = [];
    let userStatuses: Record<string, UserProblemStatusInfo> = {};

    const [bookmarkResult, statusResult] = await Promise.all([
      dbGetUserBookmarkedProblemsInfo(userId),
      dbGetAllUserProblemStatuses(userId)
    ]);

    if (Array.isArray(bookmarkResult)) {
      userBookmarks = bookmarkResult;
    } else {
       console.warn("Error fetching bookmarks for paginated problems:", (bookmarkResult as {error: string}).error);
    }

    if (typeof statusResult === 'object' && statusResult !== null && !('error' in statusResult)) {
      userStatuses = statusResult;
    } else {
       console.warn("Error fetching problem statuses for paginated problems:", (statusResult as {error: string}).error);
    }

    // Augment problems with user data
    const augmentedProblems = paginatedResult.problems.map(problem => ({
      ...problem,
      isBookmarked: userBookmarks.some(b => b.problemId === problem.id),
      currentStatus: userStatuses[problem.id]?.status || 'none',
    }));

    return {
      ...paginatedResult,
      problems: augmentedProblems,
    };

  } catch (error) {
    console.error('Error in fetchProblemsForCompanyPage action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching problems.';
    return { error: message };
  }
}
