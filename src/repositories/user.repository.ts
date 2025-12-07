import {
  BookmarkedProblemInfo,
  UserProblemStatusInfo,
  ProblemStatus,
  SavedStrategyTodoList,
  FocusTopic,
  StrategyTodoItem,
  EducationExperience,
  WorkExperience,
  GenerateCompanyStrategyOutput,
  UserProfile,
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
  serverTimestamp,
  deleteDoc,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

/**
 * Repository for User-related data access.
 */
export class UserRepository {
  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, "users", userId, "bookmarkedProblems"),
        orderBy("bookmarkedAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
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
  }

  async getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId) return {};
    const statuses: Record<string, UserProblemStatusInfo> = {};
    try {
      const progressColRef = collection(db, "users", userId, "problemProgress");
      const q = query(progressColRef, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status && data.companySlug && data.problemSlug) {
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
        `Error fetching all problem statuses for user ${userId}:`,
        error,
      );
      return {};
    }
  }

  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[],
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId || !problemIds || problemIds.length === 0) return {};
    const statuses: Record<string, UserProblemStatusInfo> = {};
    try {
      const progressColRef = collection(db, "users", userId, "problemProgress");
      const q = query(progressColRef, where(documentId(), "in", problemIds));
      const querySnapshot = await getDocs(q);

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
        `Error fetching problem statuses for user ${userId}:`,
        error,
      );
      return {};
    }
  }

  async getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>> {
    if (!userId || !problemIds || problemIds.length === 0) return new Set();
    const bookmarkedIds = new Set<string>();
    try {
      const bookmarksColRef = collection(
        db,
        "users",
        userId,
        "bookmarkedProblems",
      );
      const q = query(bookmarksColRef, where(documentId(), "in", problemIds));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        bookmarkedIds.add(docSnap.id);
      });
      return bookmarkedIds;
    } catch (error) {
      console.error(
        `Error fetching bookmarks for user ${userId}:`,
        error,
      );
      return new Set();
    }
  }

  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    if (!userId) return [];
    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
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
  }

  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    if (!userId) return [];
    try {
      const workColRef = collection(db, "users", userId, "workExperience");
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
  }

  async getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]> {
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
  }

  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string,
  ): Promise<SavedStrategyTodoList | null> {
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
  }

  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string,
  ): Promise<{ isBookmarked: boolean; error?: string }> {
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
  }

  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string,
  ): Promise<{ success: boolean; error?: string }> {
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
  }

  async updateUserDisplayName(
    userId: string,
    newDisplayName: string,
  ): Promise<{ success: boolean; error?: string }> {
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
  }

  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
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
  }

  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
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
  }

  async saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >,
  ): Promise<{ success: boolean; error?: string }> {
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
  }

  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean,
  ): Promise<{ success: boolean; error?: string }> {
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
  }

  async syncUserProfile(
    uid: string,
    email: string | null,
    displayName: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!uid) {
        return { success: false, error: "User ID is required for profile sync." };
      }

      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid,
          email,
          displayName,
          createdAt: serverTimestamp(),
        });
      } else {
        const existingData = userDocSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        if (displayName !== existingData.displayName) {
          updates.displayName = displayName;
        }
        if (email !== existingData.email) {
          updates.email = email;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(userDocRef, updates);
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Error syncing user profile to Firestore:", error);
      if (error instanceof Error) return { success: false, error: error.message };
      return {
        success: false,
        error: "An unknown error occurred while syncing user profile.",
      };
    }
  }
}

export const userRepository = new UserRepository();
