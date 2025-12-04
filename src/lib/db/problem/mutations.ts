import type { LeetCodeProblem } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { slugify } from "@/lib/utils";

/**
 * @function addProblemToDb
 * @description Adds a new problem to a company's subcollection in Firestore. If a problem with the same normalized title already exists, it updates the existing problem's data.
 * @param {string} companyId - The ID of the company to add the problem to.
 * @param {Omit<LeetCodeProblem, 'id' | 'companyId' | 'companySlug' | 'slug'> & { normalizedTitle: string }} problemData - The data for the problem to be added.
 * @returns {Promise<{ id: string | null; updated: boolean; error?: string }>} A promise that resolves to an object containing the problem's ID, whether it was updated, and an optional error message.
 */
export const addProblemToDb = async (
  companyId: string,
  problemData: Omit<
    LeetCodeProblem,
    "id" | "companyId" | "companySlug" | "slug"
  > & { normalizedTitle: string },
): Promise<{ id: string | null; updated: boolean; error?: string }> => {
  try {
    const problemSlug = slugify(problemData.title);
    const problemDocRef = doc(db, "problems", problemSlug);
    const problemSnap = await getDoc(problemDocRef);

    if (problemSnap.exists()) {
      const existingData = problemSnap.data();
      const companyIds = new Set(existingData.companyIds || []);
      companyIds.add(companyId);

      const companiesMap = existingData.companies || {};
      companiesMap[companyId] = {
        lastAskedPeriod: problemData.lastAskedPeriod,
      };

      await updateDoc(problemDocRef, {
        ...problemData, // Update common fields
        slug: problemSlug,
        companyIds: Array.from(companyIds),
        companies: companiesMap,
      });
      return { id: problemSlug, updated: true };
    } else {
      const companiesMap = {
        [companyId]: {
          lastAskedPeriod: problemData.lastAskedPeriod,
        },
      };

      const dataToSave = {
        ...problemData,
        slug: problemSlug,
        companyIds: [companyId],
        companies: companiesMap,
      };

      await setDoc(problemDocRef, dataToSave);
      return { id: problemSlug, updated: false };
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while saving problem.";
    console.error("Error in addProblemToDb:", message, error);
    return { id: null, updated: false, error: message };
  }
};
