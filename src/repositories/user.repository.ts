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
  EducationExperienceSchema,
  WorkExperienceSchema,
} from "@/types";
import { db, auth } from "@/lib/firebase";
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
  writeBatch,
  arrayUnion,
  arrayRemove,
  Query,
  CollectionReference,
} from "firebase/firestore";
import { Logger } from "@/lib/logger";

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
      Logger.error(
        `Error fetching bookmarked problems info`,
        error,
        { userId }
      );
      return [];
    }
  }

  async getUserGlobalProblemStats(userId: string): Promise<{ solvedProblemIds: string[], attemptedProblemIds: string[], bookmarkedProblemIds: string[] }> {
      if (!userId) return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
      try {
          const docRef = doc(db, "users", userId, "aggregates", "problemStats");
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
              const data = docSnap.data();
              return {
                  solvedProblemIds: (data.solvedProblemIds as string[]) || [],
                  attemptedProblemIds: (data.attemptedProblemIds as string[]) || [],
                  bookmarkedProblemIds: (data.bookmarkedProblemIds as string[]) || [],
              };
          }
          return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
      } catch (error) {
          Logger.error(`Error fetching global problem stats`, error, { userId });
          return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
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
      Logger.error(
        `Error fetching all problem statuses`,
        error,
        { userId }
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
      const querySnapshots = await this.fetchDocsByIds(progressColRef, problemIds);

      // Flatten snapshots to reduce nesting and simplify iteration
      const allDocs = querySnapshots.flatMap((qs) => qs.docs);

      for (const docSnap of allDocs) {
        const data = docSnap.data();
        if (!data.status) continue;

        statuses[docSnap.id] = {
          problemId: docSnap.id,
          status: data.status as ProblemStatus,
          companySlug: data.companySlug,
          problemSlug: data.problemSlug,
          updatedAt: data.updatedAt?.toDate(),
        };
      }

      return statuses;
    } catch (error) {
      Logger.error(
        `Error fetching problem statuses`,
        error,
        { userId }
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

      const querySnapshots = await this.fetchDocsByIds(bookmarksColRef, problemIds);

      // Flatten snapshots to reduce nesting
      const allDocs = querySnapshots.flatMap((qs) => qs.docs);

      for (const docSnap of allDocs) {
        bookmarkedIds.add(docSnap.id);
      }

      return bookmarkedIds;
    } catch (error) {
      Logger.error(
        `Error fetching bookmarks`,
        error,
        { userId }
      );
      return new Set();
    }
  }

  /**
   * Helper to fetch documents by IDs in chunks of 30 to satisfy Firestore "IN" query limits.
   */
  private async fetchDocsByIds(
      collectionRef: CollectionReference | Query,
      ids: string[]
  ) {
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          chunks.push(ids.slice(i, i + CHUNK_SIZE));
      }

      const queryPromises = chunks.map(chunk => {
          const q = query(collectionRef, where(documentId(), "in", chunk));
          return getDocs(q);
      });

      return Promise.all(queryPromises);
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
      Logger.error(
        `Error fetching education history`,
        error,
        { userId }
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
      Logger.error(`Error fetching work experience`, error, { userId });
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
          ? data.items.map((item: unknown) => {
              const typedItem = item as Partial<StrategyTodoItem>;
              return {
                ...typedItem,
                text: typeof typedItem.text === "string" ? typedItem.text : "",
                isCompleted:
                  typeof typedItem.isCompleted === "boolean"
                    ? typedItem.isCompleted
                    : false,
              };
            })
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
      Logger.error(
        `Error fetching strategy todo lists`,
        error,
        { userId }
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
          ? data.items.map((item: unknown) => {
              const typedItem = item as Partial<StrategyTodoItem>;
              return {
                ...typedItem,
                text: typeof typedItem.text === "string" ? typedItem.text : "",
                isCompleted:
                  typeof typedItem.isCompleted === "boolean"
                    ? typedItem.isCompleted
                    : false,
              };
            })
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
      Logger.error(
        `Error fetching strategy`,
        error,
        { companyId, userId }
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
    const aggregateDocRef = doc(db, "users", userId, "aggregates", "problemStats");

    try {
      const docSnap = await getDoc(bookmarkDocRef);
      const batch = writeBatch(db);
      let isBookmarked = false;

      if (docSnap.exists()) {
        batch.delete(bookmarkDocRef);
        batch.set(aggregateDocRef, {
            bookmarkedProblemIds: arrayRemove(problemId)
        }, { merge: true });
        isBookmarked = false;
      } else {
        batch.set(bookmarkDocRef, {
          bookmarkedAt: serverTimestamp(),
          companySlug: companySlug,
          problemSlug: problemSlug,
        });
        batch.set(aggregateDocRef, {
            bookmarkedProblemIds: arrayUnion(problemId)
        }, { merge: true });
        isBookmarked = true;
      }

      await batch.commit();
      return { isBookmarked };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while toggling bookmark.";
      Logger.error("Error toggling bookmark in Firestore", error);
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
    const aggregateDocRef = doc(db, "users", userId, "aggregates", "problemStats");

    try {
      const batch = writeBatch(db);

      // 1. Update individual problem status
      if (status === "none") {
        batch.delete(statusDocRef);
      } else {
        batch.set(statusDocRef, {
          status: status,
          updatedAt: serverTimestamp(),
          companySlug: companySlug,
          problemSlug: problemSlug,
        });
      }

      // 2. Update aggregate stats
      // Note: We only ADD to the aggregate arrays as requested. 
      // We do not remove from them if status changes or is removed, to keep it as a historical record of "ever solved" or "ever attempted".
      // If stricter sync is needed later, we can add logic to remove from other arrays.
      if (status === "solved") {
          batch.set(aggregateDocRef, {
              solvedProblemIds: arrayUnion(problemId)
          }, { merge: true });
      } else if (status === "attempted") {
          batch.set(aggregateDocRef, {
              attemptedProblemIds: arrayUnion(problemId)
          }, { merge: true });
      }

      await batch.commit();
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update problem status.";
      Logger.error("Error setting problem status in Firestore", error);
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
      Logger.error("Error updating user display name in Firestore", error);
      return { success: false, error: message };
    }
  }

  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) return { id: null, error: "User ID is required." };

    // Validate data using Zod schema
    const validationResult = EducationExperienceSchema.omit({
      id: true,
    }).safeParse(educationData);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => e.message)
        .join(", ");
      Logger.warn("Invalid education data provided", {
        userId,
        errors: errorMessage,
      });
      return { id: null, error: errorMessage };
    }

    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
      const docRef = await addDoc(educationColRef, {
        ...validationResult.data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add education experience.";
      Logger.error("Error adding education experience to Firestore", error);
      return { id: null, error: message };
    }
  }

  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) return { id: null, error: "User ID is required." };

    // Validate data using Zod schema
    const validationResult = WorkExperienceSchema.omit({ id: true }).safeParse(
      workData,
    );

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => e.message)
        .join(", ");
      Logger.warn("Invalid work experience data provided", {
        userId,
        errors: errorMessage,
      });
      return { id: null, error: errorMessage };
    }

    try {
      const workColRef = collection(db, "users", userId, "workExperience");
      const docRef = await addDoc(workColRef, {
        ...validationResult.data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add work experience.";
      Logger.error("Error adding work experience to Firestore", error);
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
      Logger.error("Error saving strategy to Firestore", error);
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
      Logger.error("Error updating todo item status in Firestore", error);
      return { success: false, error: message };
    }
  }

  async syncUserProfile(
    email: string | null,
    displayName: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Security: Always derive UID from the authenticated session
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "User is not authenticated." };
      }
      const uid = currentUser.uid;

      const userDocRef = doc(db, "users", uid);
      
      // Optimistic Update: Use setDoc with merge: true
      // This works even if the client is offline (writes are queued)
      // and doesn't require a prior 'read' (getDoc) which fails offline.
      // Use FieldValue type for serverTimestamp, avoiding 'any' by accepting
      // that the repository internal type might need to accept FieldValue where Date is expected
      // or by defining a WriteUserProfile type.
      // For now, we'll cast to unknown then Partial<UserProfile> which is safer than 'any',
      // but ideally we should have a FirestoreUserProfile type.
      const updates: Record<string, unknown> = {
        uid,
        lastSyncedAt: serverTimestamp(),
      };

      if (email) updates.email = email;
      if (displayName) updates.displayName = displayName;

      // We use setDoc with merge: true which creates if not exists, or updates if exists.
      await setDoc(userDocRef, updates, { merge: true });

      return { success: true };
    } catch (error) {
      Logger.error("Error syncing user profile to Firestore", error);
      if (error instanceof Error) return { success: false, error: error.message };
      return {
        success: false,
        error: "An unknown error occurred while syncing user profile.",
      };
    }
  }
}

export const userRepository = new UserRepository();
