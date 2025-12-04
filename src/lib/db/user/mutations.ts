import type {
  ProblemStatus,
  GenerateCompanyStrategyOutput,
  SavedStrategyTodoList,
  EducationExperience,
  WorkExperience,
} from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  deleteDoc,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

/**
 * @function dbToggleBookmarkProblem
 * @description Toggles a bookmark for a specific problem for a given user. If the bookmark exists, it's removed. If not, it's created.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem to bookmark.
 * @param {string} companySlug - The slug of the company associated with the problem.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ isBookmarked: boolean; error?: string }>} A promise that resolves to an object indicating the new bookmark status and an optional error message.
 */
export const dbToggleBookmarkProblem = async (
  userId: string,
  problemId: string,
  companySlug: string,
  problemSlug: string,
): Promise<{ isBookmarked: boolean; error?: string }> => {
  if (!userId || !problemId)
    return {
      isBookmarked: false,
      error: "User ID and Problem ID are required.",
    };
  const bookmarkDocRef = doc(
    db,
    "users",
    userId,
    "bookmarkedProblems",
    problemId,
  );
  try {
    const docSnap = await getDoc(bookmarkDocRef);
    if (docSnap.exists()) {
      await deleteDoc(bookmarkDocRef);
      return { isBookmarked: false };
    } else {
      await setDoc(bookmarkDocRef, {
        bookmarkedAt: serverTimestamp(),
        companySlug: companySlug,
        problemSlug: problemSlug,
      });
      return { isBookmarked: true };
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while toggling bookmark.";
    console.error("Error toggling bookmark in Firestore:", error);
    return { isBookmarked: false, error: message };
  }
};

/**
 * @function dbSetProblemStatus
 * @description Sets or removes the status of a specific problem for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem.
 * @param {ProblemStatus} status - The new status of the problem ('none' to remove).
 * @param {string} companySlug - The slug of the company associated with the problem.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const dbSetProblemStatus = async (
  userId: string,
  problemId: string,
  status: ProblemStatus,
  companySlug: string,
  problemSlug: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !problemId)
    return { success: false, error: "User ID and Problem ID are required." };
  const statusDocRef = doc(db, "users", userId, "problemProgress", problemId);
  try {
    if (status === "none") {
      await deleteDoc(statusDocRef);
    } else {
      await setDoc(statusDocRef, {
        status: status,
        updatedAt: serverTimestamp(),
        companySlug: companySlug,
        problemSlug: problemSlug,
      });
    }
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update problem status.";
    console.error("Error setting problem status in Firestore:", error);
    return { success: false, error: message };
  }
};

/**
 * @function dbUpdateUserDisplayName
 * @description Updates the display name for a user in the Firestore database.
 * @param {string} userId - The ID of the user to update.
 * @param {string} newDisplayName - The new display name for the user.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const dbUpdateUserDisplayName = async (
  userId: string,
  newDisplayName: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!userId) return { success: false, error: "User ID is required." };
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return {
      success: false,
      error: "Display name must be at least 2 characters.",
    };
  }
  const userDocRef = doc(db, "users", userId);
  try {
    await updateDoc(userDocRef, { displayName: newDisplayName.trim() });
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update display name in Firestore.";
    console.error("Error updating user display name in Firestore:", error);
    return { success: false, error: message };
  }
};

/**
 * @function dbAddUserEducation
 * @description Adds a new education experience entry to a user's profile.
 * @param {string} userId - The ID of the user.
 * @param {Omit<EducationExperience, 'id'>} educationData - The education experience data to add.
 * @returns {Promise<{ id: string | null; error?: string }>} A promise that resolves to an object containing the new document's ID or an error.
 */
export const dbAddUserEducation = async (
  userId: string,
  educationData: Omit<EducationExperience, "id">,
): Promise<{ id: string | null; error?: string }> => {
  if (!userId) return { id: null, error: "User ID is required." };
  try {
    const educationColRef = collection(db, "users", userId, "educationHistory");
    const docRef = await addDoc(educationColRef, {
      ...educationData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to add education experience.";
    console.error("Error adding education experience to Firestore:", error);
    return { id: null, error: message };
  }
};

/**
 * @function dbAddUserWorkExperience
 * @description Adds a new work experience entry to a user's profile.
 * @param {string} userId - The ID of the user.
 * @param {Omit<WorkExperience, 'id'>} workData - The work experience data to add.
 * @returns {Promise<{ id: string | null; error?: string }>} A promise that resolves to an object containing the new document's ID or an error.
 */
export const dbAddUserWorkExperience = async (
  userId: string,
  workData: Omit<WorkExperience, "id">,
): Promise<{ id: string | null; error?: string }> => {
  if (!userId) return { id: null, error: "User ID is required." };
  try {
    const workColRef = collection(db, "users", userId, "workExperience");
    const docRef = await addDoc(workColRef, {
      ...workData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add work experience.";
    console.error("Error adding work experience to Firestore:", error);
    return { id: null, error: message };
  }
};

/**
 * @function dbSaveStrategyTodoList
 * @description Saves or updates an AI-generated preparation strategy to-do list for a specific company for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company the strategy is for.
 * @param {string} companyName - The name of the company.
 * @param {Pick<GenerateCompanyStrategyOutput, 'preparationStrategy' | 'focusTopics' | 'todoItems'>} strategyData - The strategy data to be saved.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const dbSaveStrategyTodoList = async (
  userId: string,
  companyId: string,
  companyName: string,
  strategyData: Pick<
    GenerateCompanyStrategyOutput,
    "preparationStrategy" | "focusTopics" | "todoItems"
  >,
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !companyId)
    return { success: false, error: "User ID and Company ID are required." };
  const todoListDocRef = doc(
    db,
    "users",
    userId,
    "strategyTodoLists",
    companyId,
  );

  const dataToSave: SavedStrategyTodoList = {
    companyId: companyId,
    companyName: companyName,
    savedAt: new Date(),
    preparationStrategy: strategyData.preparationStrategy,
    focusTopics: strategyData.focusTopics,
    items: strategyData.todoItems,
  };

  try {
    await setDoc(todoListDocRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save strategy.";
    console.error("Error saving strategy to Firestore:", error);
    return { success: false, error: message };
  }
};

/**
 * @function dbUpdateStrategyTodoItemStatus
 * @description Updates the completion status of a single to-do item within a user's saved strategy list.
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company associated with the to-do list.
 * @param {number} itemIndex - The index of the item to update within the `items` array.
 * @param {boolean} isCompleted - The new completion status of the item.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const dbUpdateStrategyTodoItemStatus = async (
  userId: string,
  companyId: string,
  itemIndex: number,
  isCompleted: boolean,
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !companyId || itemIndex < 0) {
    return {
      success: false,
      error: "Invalid parameters for updating todo item.",
    };
  }
  const todoListDocRef = doc(
    db,
    "users",
    userId,
    "strategyTodoLists",
    companyId,
  );
  try {
    const docSnap = await getDoc(todoListDocRef);
    if (!docSnap.exists()) {
      return { success: false, error: "Todo list not found." };
    }
    const listData = docSnap.data() as SavedStrategyTodoList;
    if (!listData.items || itemIndex >= listData.items.length) {
      return { success: false, error: "Item index out of bounds." };
    }

    const updatedItems = listData.items.map((item, index) =>
      index === itemIndex ? { ...item, isCompleted: isCompleted } : item,
    );

    await updateDoc(todoListDocRef, {
      items: updatedItems,
      savedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update todo item status.";
    console.error("Error updating todo item status in Firestore:", error);
    return { success: false, error: message };
  }
};
