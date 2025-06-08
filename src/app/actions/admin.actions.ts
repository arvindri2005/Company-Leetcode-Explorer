
'use server';

import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp, writeBatch, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Company, LeetCodeProblem, DifficultyFilter, LastAskedPeriod, LastAskedFilter } from '@/types';
import { getProblemsByCompanyFromDb } from '@/lib/data'; // Assuming this can fetch all problems

/**
 * Checks if a user is an administrator by looking up their UID in the 'admins' collection.
 * @param userId The Firebase UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
export async function checkUserAdminStatus(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }
  if (!db) {
    console.error("Firestore database instance is not available in checkUserAdminStatus.");
    return false;
  }

  try {
    const adminDocRef = doc(db, 'admins', userId);
    const adminDocSnap = await getDoc(adminDocRef);
    return adminDocSnap.exists() && adminDocSnap.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}


/**
 * Recalculates and updates problem statistics (difficulty, recency, common tags)
 * for all companies in the database.
 * @returns {Promise<{success: boolean; message: string; updatedCompaniesCount?: number; errors?: any[]}>} Result of the operation.
 */
export async function triggerAllCompanyProblemStatsUpdate(): Promise<{
  success: boolean;
  message: string;
  updatedCompaniesCount?: number;
  errors?: { companyId: string; companyName: string; error: string }[];
}> {
  console.log("Starting update of all company problem statistics...");
  if (!db) {
    return { success: false, message: "Firestore database instance is not available." };
  }

  let updatedCount = 0;
  const errorList: { companyId: string; companyName: string; error: string }[] = [];

  try {
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companyIdsAndNames = companiesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string}));

    if (companyIdsAndNames.length === 0) {
      return { success: true, message: "No companies found to update.", updatedCompaniesCount: 0 };
    }

    console.log(`Found ${companyIdsAndNames.length} companies. Processing stats...`);

    for (const companyInfo of companyIdsAndNames) {
      try {
        const problemsResponse = await getProblemsByCompanyFromDb(companyInfo.id, { pageSize: 10000 }); // Fetch all problems
        const problems = problemsResponse.problems;

        const newDifficultyCounts: Required<Company['difficultyCounts']> = { Easy: 0, Medium: 0, Hard: 0 };
        const newRecencyCounts: Required<Company['recencyCounts']> = {
          last_30_days: 0,
          within_3_months: 0,
          within_6_months: 0,
          older_than_6_months: 0,
        };
        const tagFrequency: Record<string, number> = {};

        problems.forEach(problem => {
          newDifficultyCounts[problem.difficulty]++;
          if (problem.lastAskedPeriod) {
            newRecencyCounts[problem.lastAskedPeriod]++;
          }
          problem.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        });

        const sortedCommonTags = Object.entries(tagFrequency)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 7) // Get top 7 common tags
          .map(([tag, count]) => ({ tag, count }));

        const companyDocRef = doc(db, 'companies', companyInfo.id);
        await updateDoc(companyDocRef, {
          difficultyCounts: newDifficultyCounts,
          recencyCounts: newRecencyCounts,
          commonTags: sortedCommonTags,
          problemCount: problems.length, // Also ensures problemCount is accurate
          statsLastUpdatedAt: serverTimestamp(),
        });
        updatedCount++;
        console.log(`Successfully updated stats for company: ${companyInfo.name} (ID: ${companyInfo.id})`);
      } catch (e: any) {
        console.error(`Error updating stats for company ${companyInfo.name} (ID: ${companyInfo.id}):`, e);
        errorList.push({ companyId: companyInfo.id, companyName: companyInfo.name, error: e.message || String(e) });
      }
    }

    const message = `Successfully updated stats for ${updatedCount} companies. ${errorList.length > 0 ? `${errorList.length} companies failed.` : ''}`;
    console.log(message);
    return { success: true, message, updatedCompaniesCount: updatedCount, errors: errorList.length > 0 ? errorList : undefined };

  } catch (error: any) {
    console.error('Failed to trigger company problem stats update:', error);
    return { success: false, message: `An error occurred: ${error.message}`, errors: errorList };
  }
}

    