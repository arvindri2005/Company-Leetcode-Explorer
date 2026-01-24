/**
 * Work Experience Operations Module
 * Handles work experience CRUD operations
 */

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";
import type { WorkExperience } from "@/types";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for work experience operations
 */
export interface ExperienceOperations {
  /**
   * Get user's work experience
   */
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;

  /**
   * Add work experience for a user
   */
  addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Implementation of work experience operations
 */
export class ExperienceOperationsImpl implements ExperienceOperations {
  /**
   * Get user's work experience
   * @param userId - The user's unique identifier
   * @returns Array of work experiences
   */
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    if (!userId) {
      return [];
    }
    try {
      const workColRef = collection(db, "users", userId, "workExperience");
      const q = query(workColRef, orderBy("createdAt", "desc"), limit(MAX_PAGE_SIZE));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as WorkExperience
      );
    } catch (error) {
      Logger.error(`Error fetching work experience`, error, { userId });
      return [];
    }
  }

  /**
   * Add work experience for a user
   * @param userId - The user's unique identifier
   * @param workData - The work experience data to add
   * @returns Result with ID if created, or error
   */
  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      return { id: null, error: "User ID is required." };
    }

    try {
      const workColRef = collection(db, "users", userId, "workExperience");
      const docRef = await addDoc(workColRef, {
        ...workData,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding work experience to Firestore", error);
      return {
        id: null,
        error: "An unexpected error occurred while adding work experience.",
      };
    }
  }
}
