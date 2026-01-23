import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  type CollectionReference,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  type Query,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { User as UserEntity } from "@/domain/entities/user.entity";
import { auth,db } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";
import {
  type BookmarkedProblemInfo,
  type EducationExperience,
  EducationExperienceSchema,
  type FocusTopic,
  type GenerateCompanyStrategyOutput,
  type ProblemStatus,
  type SavedStrategyTodoList,
  SavedStrategyTodoListSchema,
  type StrategyTodoItem,
  type UserProblemStatusInfo,
  type WorkExperience,
  WorkExperienceSchema,
} from "@/types";

import type {
  CreateUserDTO,
  IUserRepository,
  UpdateUserDTO,
} from "../interfaces/user.repository.interface";
import { type UserDocument,UserMapper } from "../mappers/user.mapper";

const MAX_PAGE_SIZE = 50;

/**
 * Repository for User-related data access.
 * Implements IUserRepository interface for dependency injection
 */
export class UserRepository implements IUserRepository {
  /**
   * Find a user by their unique identifier
   * @param id - The user's unique identifier (uid)
   * @returns The User entity if found, null otherwise
   */
  async findById(id: string): Promise<UserEntity | null> {
    if (!id) {return null;}
    try {
      const userDocRef = doc(db, "users", id);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();

      // Security: Check authorization
      const currentUser = auth.currentUser;
      const isOwner = currentUser && currentUser.uid === id;

      // Create "Public Profile" view for non-owners
      // If the requester is not the owner, we strip sensitive fields
      const email = isOwner ? (data.email ?? null) : null;
      const preferences = isOwner ? data.preferences : {};

      const userDoc: UserDocument = {
        uid: docSnap.id,
        email: email,
        displayName: data.displayName ?? null,
        photoUrl: data.photoUrl,
        preferences: preferences,
        lastSyncedAt: data.lastSyncedAt?.toDate?.() ?? data.lastSyncedAt,
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      };
      
      return UserMapper.toDomain(userDoc);
    } catch (error) {
      Logger.error("Error fetching user by ID", error, { id });
      return null;
    }
  }

  /**
   * Find all users with optional pagination
   * @param params - Optional pagination parameters
   * @returns Paginated result containing User entities
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(params?: PaginationParams): Promise<PaginatedResult<UserEntity>> {
    // Security: Listing all users is disabled to prevent data scraping/enumeration.
    // We return an empty list instead of throwing to be graceful to any potential generic callers.
    return Promise.resolve({ items: [], totalItems: 0, hasMore: false });
  }

  /**
   * Save a new user
   * @param data - The data to create the user with
   * @returns The created User entity
   */
  async save(data: CreateUserDTO): Promise<UserEntity> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User is not authenticated");
      }
      
      const uid = currentUser.uid;
      const userDocRef = doc(db, "users", uid);
      
      const userData = {
        uid,
        email: data.email,
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        preferences: data.preferences ?? {},
        createdAt: serverTimestamp(),
        lastSyncedAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userData);
      
      return UserEntity.create(
        {
          email: data.email,
          displayName: data.displayName,
          photoUrl: data.photoUrl,
          preferences: data.preferences ?? {},
          lastSyncedAt: new Date(),
        },
        uid
      );
    } catch (error) {
      Logger.error("Error saving user", error);
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param id - The user's unique identifier
   * @param data - The data to update
   * @returns The updated User entity
   */
  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    if (!this.isAuthorized(id)) {
      throw new Error("Unauthorized access to user profile.");
    }

    try {
      const userDocRef = doc(db, "users", id);
      
      const updates: Record<string, unknown> = {};
      if (data.email !== undefined) {updates.email = data.email;}
      if (data.displayName !== undefined) {updates.displayName = data.displayName;}
      if (data.photoUrl !== undefined) {updates.photoUrl = data.photoUrl;}
      if (data.preferences !== undefined) {updates.preferences = data.preferences;}
      updates.lastSyncedAt = serverTimestamp();
      
      await updateDoc(userDocRef, updates);
      
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error("User not found after update");
      }
      
      return updatedUser;
    } catch (error) {
      Logger.error("Error updating user", error, { id });
      throw error;
    }
  }

  /**
   * Delete a user by their unique identifier
   * @param id - The user's unique identifier
   */
  async delete(id: string): Promise<void> {
    if (!this.isAuthorized(id)) {
      throw new Error("Unauthorized access to user profile.");
    }

    try {
      const userDocRef = doc(db, "users", id);
      await deleteDoc(userDocRef);
    } catch (error) {
      Logger.error("Error deleting user", error, { id });
      throw error;
    }
  }

  /**
   * Check if a user exists by their unique identifier
   * @param id - The user's unique identifier
   * @returns True if the user exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    if (!id) {return false;}
    try {
      const userDocRef = doc(db, "users", id);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists();
    } catch (error) {
      Logger.error("Error checking user existence", error, { id });
      return false;
    }
  }

  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!this.isAuthorized(userId)) {return [];}
    if (!userId) {return [];}
    try {
      const q = query(
        collection(db, "users", userId, "bookmarkedProblems"),
        orderBy("bookmarkedAt", "desc"),
        limit(MAX_PAGE_SIZE),
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
      if (!this.isAuthorized(userId)) {return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };}
      if (!userId) {return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };}
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
    if (!this.isAuthorized(userId)) {return {};}
    if (!userId) {return {};}
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
    if (!this.isAuthorized(userId)) {return {};}
    if (!userId || !problemIds || problemIds.length === 0) {return {};}
    const statuses: Record<string, UserProblemStatusInfo> = {};

    try {
      const progressColRef = collection(db, "users", userId, "problemProgress");
      const querySnapshots = await this.fetchDocsByIds(progressColRef, problemIds);

      // Flatten snapshots to reduce nesting and simplify iteration
      const allDocs = querySnapshots.flatMap((qs) => qs.docs);

      for (const docSnap of allDocs) {
        const data = docSnap.data();
        if (!data.status) {continue;}

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
    if (!this.isAuthorized(userId)) {return new Set();}
    if (!userId || !problemIds || problemIds.length === 0) {return new Set();}
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
    if (!this.isAuthorized(userId)) {return [];}
    if (!userId) {return [];}
    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
      const q = query(educationColRef, orderBy("createdAt", "desc"), limit(MAX_PAGE_SIZE));
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
    if (!this.isAuthorized(userId)) {return [];}
    if (!userId) {return [];}
    try {
      const workColRef = collection(db, "users", userId, "workExperience");
      const q = query(workColRef, orderBy("createdAt", "desc"), limit(MAX_PAGE_SIZE));
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
    if (!this.isAuthorized(userId)) {return [];}
    if (!userId) {return [];}
    try {
      const todoListsColRef = collection(
        db,
        "users",
        userId,
        "strategyTodoLists",
      );
      const q = query(todoListsColRef, orderBy("companyName", "asc"), limit(MAX_PAGE_SIZE));
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
    if (!this.isAuthorized(userId)) {return null;}
    if (!userId || !companyId) {return null;}
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
    if (!this.isAuthorized(userId)) {return { isBookmarked: false, error: "Unauthorized access to user profile." };}

    if (!userId || !problemId)
      {return {
        isBookmarked: false,
        error: "User ID and Problem ID are required.",
      };}
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
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error toggling bookmark in Firestore", error);
      return { 
        isBookmarked: false, 
        error: "An unexpected error occurred while toggling bookmark." 
      };
    }
  }

  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthorized(userId)) {return { success: false, error: "Unauthorized access to user profile." };}

    if (!userId || !problemId)
      {return { success: false, error: "User ID and Problem ID are required." };}
    
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
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error setting problem status in Firestore", error);
      return { success: false, error: "An unexpected error occurred while updating problem status." };
    }
  }

  async updateUserDisplayName(
    userId: string,
    newDisplayName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthorized(userId)) {return { success: false, error: "Unauthorized access to user profile." };}

    if (!userId) {return { success: false, error: "User ID is required." };}
    
    const trimmedName = newDisplayName ? newDisplayName.trim() : "";
    
    if (trimmedName.length < 2) {
      return {
        success: false,
        error: "Display name must be at least 2 characters.",
      };
    }
    if (trimmedName.length > 50) {
      return {
        success: false,
        error: "Display name must be less than 50 characters.",
      };
    }

    // Security: Validate display name to prevent stored XSS or injection
    if (/[<>]/.test(trimmedName)) {
      Logger.warn("Blocked attempt to set display name with invalid characters", { userId, displayName: trimmedName });
      return {
        success: false,
        error: "Display name contains invalid characters.",
      };
    }

    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { displayName: trimmedName });
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error updating user display name in Firestore", error);
      return { 
        success: false, 
        error: "An unexpected error occurred while updating display name." 
      };
    }
  }

  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    if (!this.isAuthorized(userId)) {return { id: null, error: "Unauthorized access to user profile." };}

    if (!userId) {return { id: null, error: "User ID is required." };}

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

    // Security: Validate for invalid characters to prevent XSS
    const hasInvalidChars = Object.values(educationData).some((value) => 
      typeof value === 'string' && this.hasInvalidCharacters(value)
    );

    if (hasInvalidChars) {
       Logger.warn("Blocked attempt to add education with invalid characters", { userId });
       return { id: null, error: "Input contains invalid characters." };
    }

    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
      const docRef = await addDoc(educationColRef, {
        ...validationResult.data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding education experience to Firestore", error);
      return { id: null, error: "An unexpected error occurred while adding education experience." };
    }
  }

  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    if (!this.isAuthorized(userId)) {return { id: null, error: "Unauthorized access to user profile." };}

    if (!userId) {return { id: null, error: "User ID is required." };}

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

    // Security: Validate for invalid characters to prevent XSS
    const hasInvalidChars = Object.values(workData).some((value) => 
      typeof value === 'string' && this.hasInvalidCharacters(value)
    );

    if (hasInvalidChars) {
       Logger.warn("Blocked attempt to add work experience with invalid characters", { userId });
       return { id: null, error: "Input contains invalid characters." };
    }

    try {
      const workColRef = collection(db, "users", userId, "workExperience");
      const docRef = await addDoc(workColRef, {
        ...validationResult.data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding work experience to Firestore", error);
      return { id: null, error: "An unexpected error occurred while adding work experience." };
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
    if (!this.isAuthorized(userId)) {return { success: false, error: "Unauthorized access to user profile." };}

    if (!userId || !companyId)
      {return { success: false, error: "User ID and Company ID are required." };}
    const todoListDocRef = doc(
      db,
      "users",
      userId,
      "strategyTodoLists",
      companyId,
    );

    const rawData = {
      companyId: companyId,
      companyName: companyName,
      savedAt: new Date(),
      preparationStrategy: strategyData.preparationStrategy,
      focusTopics: strategyData.focusTopics,
      items: strategyData.todoItems,
    };

    // Validate data using Zod schema
    const validationResult = SavedStrategyTodoListSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => e.message)
        .join(", ");
      Logger.warn("Invalid strategy data provided", {
        userId,
        errors: errorMessage,
      });
      return { success: false, error: errorMessage };
    }

    try {
      // Use validated data, casting to SavedStrategyTodoList is safe here as schema matches
      await setDoc(todoListDocRef, validationResult.data as SavedStrategyTodoList, { merge: true });
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error saving strategy to Firestore", error);
      return { success: false, error: "An unexpected error occurred while saving strategy." };
    }
  }

  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthorized(userId)) {return { success: false, error: "Unauthorized access to user profile." };}

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
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error updating todo item status in Firestore", error);
      return { success: false, error: "An unexpected error occurred while updating todo item." };
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

      // Security: Prioritize authenticated email if available
      if (currentUser.email) {
        updates.email = currentUser.email;
      } else if (email) {
        // Fallback to provided email only if auth email is unavailable (e.g. phone auth)
        updates.email = email;
      }

      if (displayName) {
        // Security: Sanitize display name
        let safeName = displayName.trim();
        // Truncate if too long (max 50 chars to match updateUserDisplayName limit)
        if (safeName.length > 50) {
          safeName = safeName.substring(0, 50);
        }
        
        // Security: Remove invalid characters
        if (/[<>]/.test(safeName)) {
           // If it comes from a provider with weird chars, we could strip them or just log.
           // Since this is sync, we might just want to strip them instead of failing completely.
           safeName = safeName.replace(/[<>]/g, "");
        }

        if (safeName.length > 0) {
          updates.displayName = safeName;
        }
      }

      // We use setDoc with merge: true which creates if not exists, or updates if exists.
      await setDoc(userDocRef, updates, { merge: true });

      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error syncing user profile to Firestore", error);
      return {
        success: false,
        error: "An unexpected error occurred while syncing user profile.",
      };
    }
  }

  private isAuthorized(userId: string): boolean {
    const currentUser = auth.currentUser;
    return !!currentUser && currentUser.uid === userId;
  }

  private hasInvalidCharacters(text: string | undefined | null): boolean {
    if (!text) {return false;}
    // Security: Block specific characters commonly used in XSS, while allowing standard punctuation
    // We block '<' to prevent HTML tag opening, but allow '>' for things like "GPA > 3.0"
    return /[<]/.test(text);
  }
}

export const userRepository = new UserRepository();
