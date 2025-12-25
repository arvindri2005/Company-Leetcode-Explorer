import {
  JobApplication,
  JobApplicationSchema,
} from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { Logger } from "@/lib/logger";

/**
 * Repository for Job Application-related data access.
 */
export class JobApplicationRepository {

  /**
   * Fetches all job applications for a specific user.
   * @param userId The ID of the user.
   * @returns A list of JobApplication objects.
   */
  async getUserJobApplications(userId: string): Promise<JobApplication[]> {
    if (!userId) return [];
    try {
      const applicationsColRef = collection(db, "users", userId, "jobApplications");
      const q = query(applicationsColRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: userId,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          location: data.location,
          salary: data.salary,
          status: data.status,
          appliedDate: data.appliedDate?.toDate(),
          url: data.url,
          notes: data.notes,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as JobApplication;
      });
    } catch (error) {
      Logger.error(
        `Error fetching job applications`,
        error,
        { userId }
      );
      return [];
    }
  }

  /**
   * Adds a new job application for a user.
   * @param userId The ID of the user.
   * @param applicationData The application data to add.
   * @returns The ID of the newly created application or null on error.
   */
  async addJobApplication(
    userId: string,
    applicationData: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">,
  ): Promise<{ id: string | null; error?: string }> {
    if (!userId) return { id: null, error: "User ID is required." };

    try {
      const applicationsColRef = collection(db, "users", userId, "jobApplications");
      const docRef = await addDoc(applicationsColRef, {
        ...applicationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add job application.";
      Logger.error("Error adding job application to Firestore", error);
      return { id: null, error: message };
    }
  }

  /**
   * Updates an existing job application.
   * @param userId The ID of the user.
   * @param applicationId The ID of the application to update.
   * @param updates The partial data to update.
   * @returns Success boolean and optional error message.
   */
  async updateJobApplication(
    userId: string,
    applicationId: string,
    updates: Partial<Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !applicationId) {
      return { success: false, error: "User ID and Application ID are required." };
    }

    try {
      const docRef = doc(db, "users", userId, "jobApplications", applicationId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update job application.";
      Logger.error("Error updating job application in Firestore", error);
      return { success: false, error: message };
    }
  }

  /**
   * Deletes a job application.
   * @param userId The ID of the user.
   * @param applicationId The ID of the application to delete.
   * @returns Success boolean and optional error message.
   */
  async deleteJobApplication(
    userId: string,
    applicationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !applicationId) {
      return { success: false, error: "User ID and Application ID are required." };
    }

    try {
      const docRef = doc(db, "users", userId, "jobApplications", applicationId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete job application.";
      Logger.error("Error deleting job application from Firestore", error);
      return { success: false, error: message };
    }
  }
}

export const jobApplicationRepository = new JobApplicationRepository();
