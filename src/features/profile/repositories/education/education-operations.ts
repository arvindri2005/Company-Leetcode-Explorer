/**
 * Education Operations Module
 * Handles education CRUD operations
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

import { db } from "@/shared/lib/api/firebase";
import { Logger } from "@/shared/lib/utils/logger";
import type { EducationExperience } from "@/shared/types";

import { EducationValidatorsImpl } from "./education-validators";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for education operations
 */
export interface EducationOperations {
  /**
   * Get user's education history
   */
  getUserEducation(userId: string): Promise<EducationExperience[]>;

  /**
   * Add education experience for a user
   */
  addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;
}

/**
 * Implementation of education operations
 */
export class EducationOperationsImpl implements EducationOperations {
  private validators = new EducationValidatorsImpl();

  /**
   * Get user's education history
   * @param userId - The user's unique identifier
   * @returns Array of education experiences
   */
  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    if (!userId) {
      return [];
    }
    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
      const q = query(educationColRef, orderBy("createdAt", "desc"), limit(MAX_PAGE_SIZE));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as EducationExperience
      );
    } catch (error) {
      Logger.error(`Error fetching education history`, error, { userId });
      return [];
    }
  }

  /**
   * Add education experience for a user
   * @param userId - The user's unique identifier
   * @param educationData - The education data to add
   * @returns Result with ID if created, or error
   */
  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) {
      return { id: null, error: "User ID is required." };
    }

    // Security: Validate data to prevent XSS and ensure data integrity
    const validation = this.validators.validateEducationData(educationData, userId);
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    try {
      const educationColRef = collection(db, "users", userId, "educationHistory");
      const docRef = await addDoc(educationColRef, {
        ...educationData,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error adding education experience to Firestore", error);
      return {
        id: null,
        error: "An unexpected error occurred while adding education experience.",
      };
    }
  }
}
