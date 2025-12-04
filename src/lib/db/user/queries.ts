import type {
  BookmarkedProblemInfo,
  UserProblemStatusInfo,
  ProblemStatus,
  SavedStrategyTodoList,
  FocusTopic,
  StrategyTodoItem,
  EducationExperience,
  WorkExperience,
} from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  documentId,
} from "firebase/firestore";

/**
 * @function dbGetUserBookmarkedProblemsInfo
 * @description Fetches information about all problems bookmarked by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<BookmarkedProblemInfo[]>} A promise that resolves to an array of bookmarked problem information.
 */
export const dbGetUserBookmarkedProblemsInfo = async (
  userId: string,
): Promise<BookmarkedProblemInfo[]> => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, "users", userId, "bookmarkedProblems"),
      orderBy("bookmarkedAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    console.log(
      `[DB] dbGetUserBookmarkedProblemsInfo: Fetched ${querySnapshot.docs.length} bookmarks. Cost: ${querySnapshot.docs.length} reads.`,
    );
    return querySnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          problemId: docSnap.id,
          companySlug: data.companySlug,
          problemSlug: data.problemSlug,
          bookmarkedAt: data.bookmarkedAt?.toDate(),
        } as BookmarkedProblemInfo;
      })
      .filter((info) => info.companySlug && info.problemSlug);
  } catch (error) {
    console.error(
      `Error fetching bookmarked problems info for user ${userId}:`,
      error,
    );
    return [];
  }
};

/**
 * @function dbGetAllUserProblemStatuses
 * @description Fetches all problem statuses for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Record<string, UserProblemStatusInfo>>} A promise that resolves to a dictionary mapping problem IDs to their status information.
 */
export const dbGetAllUserProblemStatuses = async (
  userId: string,
): Promise<Record<string, UserProblemStatusInfo>> => {
  if (!userId) return {};
  const statuses: Record<string, UserProblemStatusInfo> = {};
  try {
    const progressColRef = collection(db, "users", userId, "problemProgress");
    const q = query(progressColRef, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log(
      `[DB] dbGetAllUserProblemStatuses: Fetched ${querySnapshot.docs.length} statuses. Cost: ${querySnapshot.docs.length} reads.`,
    );
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status && data.companySlug && data.problemSlug) {
        statuses[docSnap.id] = {
          problemId: docSnap.id, // Ensure problemId is included
          status: data.status as ProblemStatus,
          companySlug: data.companySlug,
          problemSlug: data.problemSlug,
          updatedAt: data.updatedAt?.toDate(),
        };
      }
    });
    return statuses;
  } catch (error) {
    console.error(
      `Error fetching all problem statuses for user ${userId}:`,
      error,
    );
    return {};
  }
};

/**
 * @function dbGetProblemStatusesForIds
 * @description Fetches problem statuses for a specific list of problem IDs for a user.
 * @param {string} userId - The ID of the user.
 * @param {string[]} problemIds - The list of problem IDs to fetch statuses for.
 * @returns {Promise<Record<string, UserProblemStatusInfo>>} A promise that resolves to a dictionary mapping problem IDs to their status information.
 */
export const dbGetProblemStatusesForIds = async (
  userId: string,
  problemIds: string[],
): Promise<Record<string, UserProblemStatusInfo>> => {
  if (!userId || !problemIds || problemIds.length === 0) return {};
  const statuses: Record<string, UserProblemStatusInfo> = {};
  try {
    const progressColRef = collection(db, "users", userId, "problemProgress");

    // Firestore 'in' query is limited to 30 items. We need to batch if more.
    // Assuming page size is small (e.g. 15), we might not need batching logic here if called per page.
    // But for safety, let's just slice if needed or assume caller handles it.
    // Given the context of pagination (15 items), a single query is fine.

    const q = query(progressColRef, where(documentId(), "in", problemIds));
    const querySnapshot = await getDocs(q);
    console.log(
      `[DB] dbGetProblemStatusesForIds: Fetched ${querySnapshot.docs.length} statuses for ${problemIds.length} IDs. Cost: ${querySnapshot.docs.length} reads.`,
    );

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status) {
        statuses[docSnap.id] = {
          problemId: docSnap.id,
          status: data.status as ProblemStatus,
          companySlug: data.companySlug,
          problemSlug: data.problemSlug,
          updatedAt: data.updatedAt?.toDate(),
        };
      }
    });
    return statuses;
  } catch (error) {
    console.error(
      `Error fetching problem statuses for user ${userId} and problems ${problemIds.length}:`,
      error,
    );
    return {};
  }
};

/**
 * @function dbGetBookmarksForIds
 * @description Fetches bookmarks for a specific list of problem IDs for a user.
 * @param {string} userId - The ID of the user.
 * @param {string[]} problemIds - The list of problem IDs to check for bookmarks.
 * @returns {Promise<Set<string>>} A promise that resolves to a Set of bookmarked problem IDs.
 */
export const dbGetBookmarksForIds = async (
  userId: string,
  problemIds: string[],
): Promise<Set<string>> => {
  if (!userId || !problemIds || problemIds.length === 0) return new Set();
  const bookmarkedIds = new Set<string>();
  try {
    const bookmarksColRef = collection(
      db,
      "users",
      userId,
      "bookmarkedProblems",
    );

    // Using documentId() because the document ID is the problem ID in bookmarkedProblems collection
    const q = query(bookmarksColRef, where(documentId(), "in", problemIds));
    const querySnapshot = await getDocs(q);
    console.log(
      `[DB] dbGetBookmarksForIds: Fetched ${querySnapshot.docs.length} bookmarks for ${problemIds.length} IDs. Cost: ${querySnapshot.docs.length} reads.`,
    );

    querySnapshot.forEach((docSnap) => {
      bookmarkedIds.add(docSnap.id);
    });
    return bookmarkedIds;
  } catch (error) {
    console.error(
      `Error fetching bookmarks for user ${userId} and problems ${problemIds.length}:`,
      error,
    );
    return new Set();
  }
};

/**
 * @function dbGetUserEducation
 * @description Fetches all education experience entries for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<EducationExperience[]>} A promise that resolves to an array of education experiences.
 */
export const dbGetUserEducation = async (
  userId: string,
): Promise<EducationExperience[]> => {
  if (!userId) return [];
  try {
    const educationColRef = collection(db, "users", userId, "educationHistory");
    // Consider ordering if needed, e.g., by graduationYear
    const q = query(educationColRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) =>
        ({
          id: docSnap.id,
          ...docSnap.data(),
        }) as EducationExperience,
    );
  } catch (error) {
    console.error(
      `Error fetching education history for user ${userId}:`,
      error,
    );
    return [];
  }
};

/**
 * @function dbGetUserWorkExperience
 * @description Fetches all work experience entries for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<WorkExperience[]>} A promise that resolves to an array of work experiences.
 */
export const dbGetUserWorkExperience = async (
  userId: string,
): Promise<WorkExperience[]> => {
  if (!userId) return [];
  try {
    const workColRef = collection(db, "users", userId, "workExperience");
    // Consider ordering if needed, e.g., by startDate or createdAt
    const q = query(workColRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) =>
        ({
          id: docSnap.id,
          ...docSnap.data(),
        }) as WorkExperience,
    );
  } catch (error) {
    console.error(`Error fetching work experience for user ${userId}:`, error);
    return [];
  }
};

/**
 * @function dbGetUserStrategyTodoLists
 * @description Fetches all saved AI-generated strategy to-do lists for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<SavedStrategyTodoList[]>} A promise that resolves to an array of saved strategy to-do lists.
 */
export const dbGetUserStrategyTodoLists = async (
  userId: string,
): Promise<SavedStrategyTodoList[]> => {
  if (!userId) return [];
  try {
    const todoListsColRef = collection(
      db,
      "users",
      userId,
      "strategyTodoLists",
    );
    const q = query(todoListsColRef, orderBy("companyName", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const items = Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            ...item,
            isCompleted:
              typeof item.isCompleted === "boolean" ? item.isCompleted : false,
          }))
        : [];
      const focusTopics = Array.isArray(data.focusTopics)
        ? data.focusTopics
        : [];
      return {
        companyId: data.companyId || docSnap.id,
        companyName: data.companyName || "Unknown Company",
        savedAt: data.savedAt?.toDate
          ? data.savedAt.toDate()
          : new Date(data.savedAt || Date.now()),
        preparationStrategy: data.preparationStrategy || "",
        focusTopics: focusTopics as FocusTopic[],
        items: items as StrategyTodoItem[],
      } as SavedStrategyTodoList;
    });
  } catch (error) {
    console.error(
      `Error fetching strategy todo lists for user ${userId}:`,
      error,
    );
    return [];
  }
};

/**
 * @function dbGetStrategyTodoListForCompany
 * @description Fetches a specific AI-generated strategy to-do list for a user and company.
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<SavedStrategyTodoList | null>} A promise that resolves to the saved strategy to-do list, or null if not found.
 */
export const dbGetStrategyTodoListForCompany = async (
  userId: string,
  companyId: string,
): Promise<SavedStrategyTodoList | null> => {
  if (!userId || !companyId) return null;
  const todoListDocRef = doc(
    db,
    "users",
    userId,
    "strategyTodoLists",
    companyId,
  );
  try {
    const docSnap = await getDoc(todoListDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const items = Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            ...item,
            isCompleted:
              typeof item.isCompleted === "boolean" ? item.isCompleted : false,
          }))
        : [];
      const focusTopics = Array.isArray(data.focusTopics)
        ? data.focusTopics
        : [];
      return {
        companyId: data.companyId || companyId,
        companyName: data.companyName || "Unknown Company",
        savedAt: data.savedAt?.toDate
          ? data.savedAt.toDate()
          : new Date(data.savedAt || Date.now()),
        preparationStrategy: data.preparationStrategy || "",
        focusTopics: focusTopics as FocusTopic[],
        items: items as StrategyTodoItem[],
      } as SavedStrategyTodoList;
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching strategy for company ${companyId}, user ${userId}:`,
      error,
    );
    return null;
  }
};
