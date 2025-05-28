
'use server';

import type { GroupQuestionsInput, GroupQuestionsOutput } from '@/ai/flows/group-questions';
import { groupQuestions as groupQuestionsFlow } from '@/ai/flows/group-questions';
import type { FindSimilarQuestionsInput, FindSimilarQuestionsOutput } from '@/ai/flows/find-similar-questions-flow';
import { findSimilarQuestions as findSimilarQuestionsFlow } from '@/ai/flows/find-similar-questions-flow';
import type { GenerateFlashcardsInput, GenerateFlashcardsOutput, FlashcardProblemInput } from '@/ai/flows/generate-flashcards-flow';
import { generateFlashcardsForCompany as generateFlashcardsFlow } from '@/ai/flows/generate-flashcards-flow';
import type { GenerateCompanyStrategyInput, GenerateCompanyStrategyOutput, CompanyStrategyProblemInput, TargetRoleLevel } from '@/ai/flows/generate-company-strategy-flow';
import { generateCompanyStrategy as generateCompanyStrategyFlow } from '@/ai/flows/generate-company-strategy-flow';
import type { GenerateProblemInsightsInput, GenerateProblemInsightsOutput } from '@/ai/flows/generate-problem-insights-flow';
import { generateProblemInsights as generateProblemInsightsFlow } from '@/ai/flows/generate-problem-insights-flow';
import type { AIProblemInput, LeetCodeProblem, Company, LastAskedPeriod, ProblemStatus, UserProfile, ChatMessage } from '@/types';
import { conductInterviewTurn as conductInterviewTurnFlow, type MockInterviewOutput } from '@/ai/flows/mock-interview-flow';
import { lastAskedPeriodOptions } from '@/types';
import { addProblemToDb, addCompanyToDb, getCompanies as getAllCompaniesFromDbInternal, getAllProblems, getProblemById as getProblemByIdFromDb, getCompanyById as getCompanyByIdFromDb, getProblemsByCompany as getProblemsByCompanyFromDb, dbToggleBookmarkProblem, dbGetUserBookmarkedProblemIds, dbSetProblemStatus, dbGetAllUserProblemStatuses, dbUpdateUserDisplayName } from '@/lib/data';
import { revalidatePath, revalidateTag } from 'next/cache';
import { collection, getDocs, query, where, limit, FieldValue, doc as firestoreDoc, updateDoc as firestoreUpdateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// auth is not directly used in actions, user identification relies on client passing UID or framework context if available for server actions
// import { auth } from '@/lib/firebase'; 
// import { headers } from 'next/headers'; // Example if needing request headers

/**
 * Performs AI-powered grouping of LeetCode questions.
 * @param {AIProblemInput[]} problems - An array of problems to be grouped.
 * @returns {Promise<GroupQuestionsOutput | { error: string }>} The grouped questions output or an error object.
 */
export async function performQuestionGrouping(
  problems: AIProblemInput[]
): Promise<GroupQuestionsOutput | { error: string }> {
  try {
    const input: GroupQuestionsInput = { questions: problems };
    const result = await groupQuestionsFlow(input);
    return result;
  } catch (error) {
    console.error('Error in AI question grouping:', error);
    if (error instanceof Error) return { error: `Failed to group questions: ${error.message}` };
    return { error: 'Failed to group questions due to an unknown error. Please try again.' };
  }
}

/**
 * Performs AI-powered search for similar LeetCode questions.
 * @param {LeetCodeProblem} currentProblem - The problem for which to find similar ones.
 * @returns {Promise<FindSimilarQuestionsOutput | { error: string }>} The similar questions output or an error object.
 */
export async function performSimilarQuestionSearch(
  currentProblem: LeetCodeProblem
): Promise<FindSimilarQuestionsOutput | { error: string }> {
  try {
    const allProblems = await getAllProblems();
    const candidateProblems = allProblems.filter(p => p.id !== currentProblem.id).map(p => ({
      id: p.id, title: p.title, difficulty: p.difficulty, tags: p.tags, link: p.link,
    }));
    if (candidateProblems.length === 0) return { similarProblems: [] }; // No other problems to compare against
    const input: FindSimilarQuestionsInput = {
      currentProblem: { title: currentProblem.title, difficulty: currentProblem.difficulty, tags: currentProblem.tags },
      candidateProblems,
    };
    return await findSimilarQuestionsFlow(input);
  } catch (error) {
    console.error('Error in AI similar question search:', error);
    if (error instanceof Error) return { error: `Failed to find similar questions: ${error.message}` };
    return { error: 'Failed to find similar questions due to an unknown error.' };
  }
}

/**
 * Adds a new LeetCode problem to the database.
 * If a problem with the same title and companyId already exists, it updates the lastAskedPeriod.
 * @param {Omit<LeetCodeProblem, 'id' | 'normalizedTitle'>} problemData - The data for the problem to add.
 * @returns {Promise<{ success: boolean; data?: LeetCodeProblem; updated?: boolean; error?: string }>} Result of the operation.
 */
export async function addProblem(
  problemData: Omit<LeetCodeProblem, 'id' | 'normalizedTitle'>
): Promise<{ success: boolean; data?: LeetCodeProblem; updated?: boolean; error?: string }> {
  try {
    // Basic validation, more can be added as needed
    if (!problemData.title || !problemData.difficulty || !problemData.link || !problemData.companyId || problemData.tags.length === 0 || !problemData.lastAskedPeriod) {
      return { success: false, error: 'Missing required fields for problem submission.' };
    }
    if (!problemData.link.startsWith('http://') && !problemData.link.startsWith('https://')) {
      return { success: false, error: 'Invalid problem link format. Must start with http:// or https://.' };
    }

    const problemDataForDb: Omit<LeetCodeProblem, 'id'> = { ...problemData, normalizedTitle: problemData.title.toLowerCase() };
    const { id: problemId, updated, error: dbError } = await addProblemToDb(problemDataForDb);

    if (dbError || !problemId) {
      return { success: false, error: dbError || 'Failed to save problem to the database.' };
    }
    
    // Revalidation handled by bulk action if called from there, or here for single add.
    // This function itself no longer handles revalidation directly.
    
    return { success: true, data: { ...problemDataForDb, id: problemId }, updated };
  } catch (error) {
    console.error('Error adding problem (action level):', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while adding the problem.' };
  }
}

/**
 * Adds a new company to the database.
 * @param {Omit<Company, 'id' | 'normalizedName'>} companyDataInput - The data for the company to add.
 * @returns {Promise<{ success: boolean; data?: Company; error?: string }>} Result of the operation.
 */
export async function addCompany(
  companyDataInput: Omit<Company, 'id' | 'normalizedName'>
): Promise<{ success: boolean; data?: Company; error?: string }> {
  try {
    if (!companyDataInput.name) {
      return { success: false, error: 'Company name is required.' };
    }

    let companyData = { ...companyDataInput };
    if (companyData.website && !companyData.website.startsWith('http')) {
      companyData.website = `https://${companyData.website}`;
    }
    if (companyData.logo && !companyData.logo.startsWith('http')) {
      companyData.logo = `https://${companyData.logo}`;
    }
    // Validate URLs after potential prefixing
    if (companyData.website) {
      try { new URL(companyData.website); } 
      catch { return { success: false, error: `Invalid website URL: ${companyData.website}. Ensure it includes http:// or https://.` }; }
    }
    if (companyData.logo) {
      try { new URL(companyData.logo); } 
      catch { return { success: false, error: `Invalid logo URL: ${companyData.logo}. Ensure it includes http:// or https://.` }; }
    }

    const companyDataForDb: Omit<Company, 'id'> = { ...companyData, normalizedName: companyData.name.toLowerCase() };
    const { id: newCompanyId, error: dbError } = await addCompanyToDb(companyDataForDb);

    if (dbError || !newCompanyId) {
      return { success: false, error: dbError || 'Failed to save company to the database.' };
    }
    // This function itself no longer handles revalidation directly.
    return { success: true, data: { ...companyDataForDb, id: newCompanyId } };
  } catch (error) {
    console.error('Error adding company (action level):', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while adding the company.' };
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
  const affectedCompanyIds = new Set<string>(); // To revalidate specific company pages

  // Fetch all companies once to map names to IDs efficiently
  const companiesData = await getAllCompaniesFromDbInternal({ pageSize: 100000 }); // Fetch all companies
  const companyMap = new Map(companiesData.companies.map(c => [c.normalizedName || c.name.toLowerCase(), c.id]));
  const validLastAskedPeriods = lastAskedPeriodOptions.map(opt => opt.value);

  for (let i = 0; i < problemsFromExcel.length; i++) {
    const raw = problemsFromExcel[i];
    const title = String(raw.title || '').trim();
    if (!title) { errors++; detailedResults.push({ rowIndex: i, title: '(No Title)', status: 'error', message: 'Missing problem title.' }); continue; }

    const companyName = String(raw.companyName || '').trim();
    if (!companyName) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: 'Missing company name.' }); continue; }
    
    const companyId = companyMap.get(companyName.toLowerCase());
    if (!companyId) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Company "${companyName}" not found in database.` }); continue; }

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
    if (tags.length === 0) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: 'Missing tags. Provide at least one tag, comma-separated.' }); continue; }
    
    const lastAskedPeriod = String(raw.lastAskedPeriod || '').trim() as LastAskedPeriod;
    if (!validLastAskedPeriods.includes(lastAskedPeriod)) { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: `Invalid Last Asked Period: "${lastAskedPeriod}". Valid options: ${validLastAskedPeriods.join(', ')}.` }); continue; }

    const result = await addProblemToDb({ title, difficulty, link, tags, companyId, lastAskedPeriod, normalizedTitle: title.toLowerCase() });
    if (result.id) {
      if (result.updated) { updated++; detailedResults.push({ rowIndex: i, title, status: 'updated', message: 'Updated existing problem.' }); }
      else { added++; detailedResults.push({ rowIndex: i, title, status: 'added', message: 'Added new problem.' }); }
      affectedCompanyIds.add(companyId);
    } else { errors++; detailedResults.push({ rowIndex: i, title, status: 'error', message: result.error || 'Database error occurred.' }); }
  }

  // Perform revalidation once after all operations
  if (added > 0 || updated > 0) {
    revalidateTag('problems-collection-broad'); // Broad revalidation for all problems list
    affectedCompanyIds.forEach(id => revalidateTag(`problems-for-company-${id}`));
    // Revalidate common pages that might list problems or companies
    ['/', '/submit-problem', '/bulk-add-problems'].forEach(p => revalidatePath(p));
    affectedCompanyIds.forEach(id => revalidatePath(`/company/${id}`)); // Revalidate specific company pages
  }

  return { addedCount: added, updatedCount: updated, errorCount: errors, detailedResults };
}

interface RawExcelCompanyData { name: string; logo?: string; description?: string; website?: string; }
interface BulkAddCompanyDetailedResult { rowIndex: number; name: string; status: 'added' | 'updated' | 'skipped' | 'error'; message: string; }

/**
 * Adds or updates multiple companies from an Excel sheet.
 * If a company with the same name (case-insensitive) exists, its logo and description are updated.
 * @param {RawExcelCompanyData[]} companiesFromExcel - Array of raw company data parsed from Excel.
 * @returns {Promise<{ addedCount: number; updatedCount: number; skippedCount: number; errorCount: number; detailedResults: BulkAddCompanyDetailedResult[] }>} Summary and detailed results.
 */
export async function bulkAddCompanies(
  companiesFromExcel: RawExcelCompanyData[]
): Promise<{ addedCount: number; updatedCount: number; skippedCount: number; errorCount: number; detailedResults: BulkAddCompanyDetailedResult[] }> {
  let added = 0, updated = 0, skipped = 0, errors = 0;
  const detailedResults: BulkAddCompanyDetailedResult[] = [];
  const companiesToRevalidate = new Set<string>(); // Store IDs of companies that were added/updated

  // Fetch existing companies to check for updates
  const existingData = await getAllCompaniesFromDbInternal({ pageSize: 100000 }); // Assuming up to 100k companies
  const companyMap = new Map(existingData.companies.map(c => [c.normalizedName || c.name.toLowerCase(), c]));

  for (let i = 0; i < companiesFromExcel.length; i++) {
    const raw = companiesFromExcel[i];
    let name = String(raw.name || '').trim();
    if (!name) { errors++; detailedResults.push({ rowIndex: i, name: '(No Name)', status: 'error', message: 'Missing company name.' }); continue; }
    
    let logo = String(raw.logo || '').trim();
    let website = String(raw.website || '').trim();
    const description = String(raw.description || '').trim();

    // Prepend https:// if scheme is missing
    if (website && !website.startsWith('http')) website = `https://${website}`;
    if (logo && !logo.startsWith('http')) logo = `https://${logo}`;

    // Validate URLs after potential prefixing
    if (website) {
        try { new URL(website); } 
        catch { errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Invalid Website URL: ${website}.`}); continue; }
    }
    if (logo) {
        try { new URL(logo); } 
        catch { errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Invalid Logo URL: ${logo}.`}); continue; }
    }

    const existingCompany = companyMap.get(name.toLowerCase());
    if (existingCompany) {
      // Company exists, check for updates
      const payload: Partial<Company> & { normalizedName?: string; logo?: FieldValue | string; description?: FieldValue | string; website?: FieldValue | string } = {};
      let needsUpdate = false;

      // If Excel name is different from DB (even if normalizedName is same), update both name and normalizedName
      if (name !== existingCompany.name) { payload.name = name; payload.normalizedName = name.toLowerCase(); needsUpdate = true; }
      
      if (logo === '' && existingCompany.logo) { payload.logo = FieldValue.delete(); needsUpdate = true; } // Clear logo
      else if (logo && logo !== existingCompany.logo) { payload.logo = logo; needsUpdate = true; }
      
      if (description === '' && existingCompany.description) { payload.description = FieldValue.delete(); needsUpdate = true; } // Clear description
      else if (description && description !== existingCompany.description) { payload.description = description; needsUpdate = true; }

      if (website === '' && existingCompany.website) { payload.website = FieldValue.delete(); needsUpdate = true; } // Clear website
      else if (website && website !== existingCompany.website) { payload.website = website; needsUpdate = true; }


      if (needsUpdate && Object.keys(payload).length > 0) {
        try {
          await firestoreUpdateDoc(firestoreDoc(db, 'companies', existingCompany.id), payload);
          updated++; detailedResults.push({ rowIndex: i, name, status: 'updated', message: 'Updated existing company.' }); companiesToRevalidate.add(existingCompany.id);
        } catch (e) { 
          const errorMsg = e instanceof Error ? e.message : 'Unknown error during update.';
          errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Update failed: ${errorMsg}` }); 
        }
      } else if (!detailedResults.find(r => r.rowIndex === i && r.status === 'error')) { // Check if not already marked as error
        skipped++; detailedResults.push({ rowIndex: i, name, status: 'skipped', message: 'No changes needed.' });
      }
    } else {
      // New company
      const result = await addCompanyToDb({ 
        name, 
        logo: logo || undefined, 
        description: description || undefined, 
        website: website || undefined,
        normalizedName: name.toLowerCase() 
      });
      if (result.id) { 
        added++; detailedResults.push({ rowIndex: i, name, status: 'added', message: 'Added new company.' }); companiesToRevalidate.add(result.id);
      } else { 
        errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: result.error || 'Database error occurred adding new company.' }); 
      }
    }
  }

  // Perform revalidation once
  if (added > 0 || updated > 0) {
    revalidateTag('companies-collection-broad');
    companiesToRevalidate.forEach(id => revalidateTag(`company-detail-${id}`));
    ['/', '/add-company', '/submit-problem', '/bulk-add-problems', '/bulk-add-companies'].forEach(p => revalidatePath(p));
    companiesToRevalidate.forEach(id => revalidatePath(`/company/${id}`));
  }

  return { addedCount: added, updatedCount: updated, skippedCount: skipped, errorCount: errors, detailedResults };
}

/**
 * Fetches a paginated list of companies, optionally filtered by a search term.
 * @param {number} page - The current page number (1-indexed).
 * @param {number} pageSize - The number of companies per page.
 * @param {string} [searchTerm] - Optional search term to filter companies by name or description.
 * @returns {Promise<{ companies: Company[]; totalPages: number; totalCompanies: number; currentPage: number; error?: string }>} Paginated company data or an error object.
 */
export async function fetchCompaniesAction(
  page: number, pageSize: number, searchTerm?: string
): Promise<{ companies: Company[]; totalPages: number; totalCompanies: number; currentPage: number; error?: string }> {
  try {
    // getAllCompaniesFromDbInternal handles caching and pagination
    return await getAllCompaniesFromDbInternal({ page, pageSize, searchTerm });
  } catch (error) {
    console.error('Error fetching companies in action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching companies.';
    return { companies: [], totalPages: 0, totalCompanies: 0, currentPage: 1, error: message };
  }
}

/**
 * Handles a single turn in the AI-powered mock interview.
 * @param {string} problemId - The ID of the LeetCode problem for the interview.
 * @param {ChatMessage[]} conversationHistory - The history of messages in the current interview.
 * @param {string} currentUserMessage - The user's latest message or response.
 * @returns {Promise<MockInterviewOutput | { error: string }>} The AI interviewer's response or an error object.
 */
export async function handleInterviewTurn(
  problemId: string, conversationHistory: ChatMessage[], currentUserMessage: string
): Promise<MockInterviewOutput | { error: string }> {
  try {
    if (!problemId) return { error: 'Problem ID is required for the interview.' };
    
    // If conversation is empty and user sends no message, initiate with a default greeting.
    if (!currentUserMessage && conversationHistory.length === 0) {
      currentUserMessage = "Let's start.";
    } else if (!currentUserMessage) {
      return { error: 'User message cannot be empty.' };
    }

    const problem = await getProblemByIdFromDb(problemId);
    if (!problem) return { error: `Problem with ID ${problemId} not found.` };

    const problemDescriptionForAI = `Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(', ')}. Problem Link (for context, not for user to click): ${problem.link}`;
    
    const input = { 
      problemTitle: problem.title, 
      problemDifficulty: problem.difficulty, 
      problemDescription: problemDescriptionForAI, 
      problemTags: problem.tags, 
      conversationHistory, 
      currentUserMessage 
    };
    const result: MockInterviewOutput = await conductInterviewTurnFlow(input);
    return result;
  } catch (error) {
    console.error('Error in AI interview turn:', error);
    if (error instanceof Error) return { error: `AI interview turn failed: ${error.message}` };
    return { error: 'An unknown error occurred during the interview turn.' };
  }
}

/**
 * Generates AI-powered study flashcards for a given company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<GenerateFlashcardsOutput | { error: string }>} The generated flashcards or an error object.
 */
export async function generateFlashcardsAction(companyId: string): Promise<GenerateFlashcardsOutput | { error: string }> {
  try {
    if (!companyId) return { error: 'Company ID is required to generate flashcards.' };
    
    const company = await getCompanyByIdFromDb(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };
    
    const problems = await getProblemsByCompanyFromDb(companyId);
    if (!problems || problems.length === 0) {
      // Return empty flashcards if no problems, as AI might struggle without input
      return { flashcards: [] }; 
    }

    const problemInputs: FlashcardProblemInput[] = problems.map(p => ({ 
      title: p.title, 
      difficulty: p.difficulty, 
      tags: p.tags, 
      lastAskedPeriod: p.lastAskedPeriod 
    }));
    
    const result = await generateFlashcardsFlow({ companyName: company.name, problems: problemInputs });
    return result;
  } catch (error) {
    console.error('Error in AI flashcard generation:', error);
    if (error instanceof Error) return { error: `Failed to generate flashcards: ${error.message}` };
    return { error: 'An unknown error occurred while generating flashcards.' };
  }
}

/**
 * Generates an AI-powered preparation strategy for a given company and target role level.
 * @param {string} companyId - The ID of the company.
 * @param {TargetRoleLevel} [targetRoleLevel] - The target role level (e.g., internship, new_grad).
 * @returns {Promise<GenerateCompanyStrategyOutput | { error: string }>} The generated strategy or an error object.
 */
export async function generateCompanyStrategyAction(
  companyId: string, targetRoleLevel?: TargetRoleLevel
): Promise<GenerateCompanyStrategyOutput | { error: string }> {
  try {
    if (!companyId) return { error: 'Company ID is required to generate a strategy.' };

    const company = await getCompanyByIdFromDb(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problems = await getProblemsByCompanyFromDb(companyId);
    if (!problems || problems.length === 0) {
      const reason = targetRoleLevel && targetRoleLevel !== 'general' 
        ? `No problem data available for ${company.name} to tailor a strategy for the ${targetRoleLevel} role.` 
        : `No problem data available for ${company.name} to generate a strategy.`;
      return { 
        preparationStrategy: `Cannot generate a detailed strategy for ${company.name} due to lack of problem data. Please add some problems associated with this company first. General advice: Focus on common data structures, algorithms, and practice problem-solving.`, 
        focusTopics: [{ topic: "General Problem Solving", reason }] 
      };
    }

    const problemInputs: CompanyStrategyProblemInput[] = problems.map(p => ({ 
      title: p.title, 
      difficulty: p.difficulty, 
      tags: p.tags, 
      lastAskedPeriod: p.lastAskedPeriod 
    }));
    
    const result = await generateCompanyStrategyFlow({ 
      companyName: company.name, 
      problems: problemInputs, 
      targetRoleLevel 
    });
    return result;
  } catch (error) {
    console.error('Error in AI company strategy generation:', error);
    if (error instanceof Error) return { error: `Failed to generate strategy: ${error.message}` };
    return { error: 'An unknown error occurred while generating the strategy.' };
  }
}

interface SyncUserProfileInput { uid: string; email: string | null; displayName: string | null; }
/**
 * Synchronizes Firebase Auth user data to a Firestore user profile document.
 * Creates the profile if it doesn't exist, or updates it if displayName/email changes.
 * @param {SyncUserProfileInput} userData - User data from Firebase Auth.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the sync operation.
 */
export async function syncUserProfile(userData: SyncUserProfileInput): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userData.uid) return { success: false, error: "User ID is required for profile sync." };

    const userDocRef = firestoreDoc(db, 'users', userData.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, { 
        uid: userData.uid, 
        email: userData.email, 
        displayName: userData.displayName, 
        createdAt: serverTimestamp() // Record creation time
      });
    } else {
      // Optionally update existing fields if they differ
      const existingData = userDocSnap.data() as UserProfile; // Assume UserProfile type
      const updates: Partial<UserProfile> = {};
      if (userData.displayName !== existingData.displayName) {
        updates.displayName = userData.displayName;
      }
      if (userData.email !== existingData.email) {
         updates.email = userData.email;
      }
      // Add other fields to update if necessary, e.g., photoURL
      
      if (Object.keys(updates).length > 0) {
        await firestoreUpdateDoc(userDocRef, updates);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while syncing user profile.' };
  }
}

/**
 * Toggles a problem's bookmark status for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem to bookmark/unbookmark.
 * @returns {Promise<{ success: boolean; isBookmarked?: boolean; error?: string }>} Result including new bookmark state.
 */
export async function toggleBookmarkProblemAction(userId: string, problemId: string): Promise<{ success: boolean; isBookmarked?: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot toggle bookmark.' };
  if (!problemId) return { success: false, error: 'Problem ID is required to toggle bookmark.' };
  
  try {
    const result = await dbToggleBookmarkProblem(userId, problemId);
    if (result.error) return { success: false, error: result.error };
    
    revalidateTag(`user-bookmarks-${userId}`); // Revalidate cache for this user's bookmarks
    return { success: true, isBookmarked: result.isBookmarked };
  } catch (error) {
    console.error('Error in toggleBookmarkProblemAction:', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while toggling bookmark.' };
  }
}

/**
 * Fetches the IDs of all problems bookmarked by a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string[] | { error: string }>} Array of bookmarked problem IDs or an error object.
 */
export async function getUsersBookmarkedProblemIdsAction(userId: string): Promise<string[] | { error: string }> {
  if (!userId) return { error: 'User not authenticated. Cannot fetch bookmarks.' };
  try {
    return await dbGetUserBookmarkedProblemIds(userId);
  } catch (error) {
    console.error('Error in getUsersBookmarkedProblemIdsAction:', error);
    if (error instanceof Error) return { error: error.message };
    return { error: 'An unknown error occurred while fetching bookmarks.' };
  }
}

/**
 * Fetches full details for a batch of problem IDs.
 * @param {string[]} problemIds - An array of problem IDs.
 * @returns {Promise<LeetCodeProblem[]>} An array of LeetCodeProblem objects. Returns empty if input is empty or on error.
 */
export async function getProblemDetailsBatchAction(problemIds: string[]): Promise<LeetCodeProblem[]> {
  if (!problemIds || problemIds.length === 0) return [];
  try {
    // getProblemByIdFromDb uses unstable_cache, so batching calls here is acceptable
    // as individual calls will hit the cache if data is already fetched.
    const problems = await Promise.all(problemIds.map(id => getProblemByIdFromDb(id)));
    return problems.filter(Boolean) as LeetCodeProblem[]; // Filter out any undefined results (e.g., if a problem was deleted)
  } catch (error) { 
    console.error('Error in getProblemDetailsBatchAction:', error); 
    return []; // Return empty array on error to prevent client-side issues
  }
}

// --- Problem Progress Tracking Actions ---
/**
 * Sets or clears the progress status for a problem for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem.
 * @param {ProblemStatus} status - The new status for the problem.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function setProblemStatusAction(
  userId: string, 
  problemId: string,
  status: ProblemStatus
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot set problem status.' };
  if (!problemId) return { success: false, error: 'Problem ID is required to set status.' };
  
  try {
    const result = await dbSetProblemStatus(userId, problemId, status);
    if (result.success) {
      revalidateTag(`user-problem-statuses-${userId}`); // Revalidate cache for this user's statuses
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set problem status due to an unknown error.';
    console.error('Error in setProblemStatusAction:', error);
    return { success: false, error: message };
  }
}

/**
 * Fetches all problem statuses for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Record<string, ProblemStatus> | { error: string }>} A map of problem IDs to their statuses, or an error object.
 */
export async function getAllUserProblemStatusesAction(
  userId: string 
): Promise<Record<string, ProblemStatus> | { error: string }> {
  if (!userId) return { error: 'User not authenticated. Cannot fetch problem statuses.' };
  try {
    return await dbGetAllUserProblemStatuses(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problem statuses due to an unknown error.';
    console.error('Error in getAllUserProblemStatusesAction:', error);
    return { error: message };
  }
}

// --- User Profile Update Actions ---
/**
 * Updates a user's display name in Firestore.
 * @param {string} userId - The ID of the user.
 * @param {string} newDisplayName - The new display name.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function updateUserDisplayNameInFirestore(
  userId: string,
  newDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot update display name.' };
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters.' };
  }
  
  try {
    const result = await dbUpdateUserDisplayName(userId, newDisplayName.trim());
    if (result.success) {
      revalidateTag(`user-profile-${userId}`); // Revalidate cache for this user's profile
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update display name in Firestore due to an unknown error.';
    console.error('Error in updateUserDisplayNameInFirestore action:', error);
    return { success: false, error: message };
  }
}

// --- AI Problem Insights Action ---
/**
 * Generates AI-powered insights (key concepts, common structures/algorithms, hint) for a LeetCode problem.
 * @param {LeetCodeProblem} problem - The LeetCode problem object.
 * @returns {Promise<GenerateProblemInsightsOutput | { error: string }>} The generated insights or an error object.
 */
export async function generateProblemInsightsAction(
  problem: LeetCodeProblem
): Promise<GenerateProblemInsightsOutput | { error: string }> {
  try {
    if (!problem) return { error: 'Problem details are required to generate insights.' };

    // Construct a descriptive summary for the AI, including the link for context.
    const problemDescriptionForAI = `Problem Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(', ')}. Link (for context only): ${problem.link}. Analyze this problem to provide key concepts, common data structures, common algorithms, and a high-level hint.`;
    
    const input: GenerateProblemInsightsInput = {
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      problemDescription: problemDescriptionForAI,
    };
    const result = await generateProblemInsightsFlow(input);
    return result;
  } catch (error) {
    console.error('Error in AI problem insights generation:', error);
    if (error instanceof Error) return { error: `Failed to generate insights: ${error.message}` };
    return { error: 'An unknown error occurred while generating problem insights.' };
  }
}
