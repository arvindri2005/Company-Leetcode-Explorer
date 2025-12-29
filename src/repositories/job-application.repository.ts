import {
  JobApplication,
  JobApplicationSchema,
} from "@/types/job-application";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Firestore,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Logger } from "@/lib/logger";

function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

export class JobApplicationRepository {
  private getCollection(userId: string) {
    return collection(getFirestore(), "users", userId, "job_applications");
  }

  async addApplication(
    userId: string,
    data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const colRef = this.getCollection(userId);
      const now = serverTimestamp();

      const docRef = await addDoc(colRef, {
        ...data,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      Logger.error("Error adding job application", error, { userId });
      throw error;
    }
  }

  async updateApplication(
    userId: string,
    applicationId: string,
    data: Partial<Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    try {
      const docRef = doc(this.getCollection(userId), applicationId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      Logger.error("Error updating job application", error, { userId, applicationId });
      throw error;
    }
  }

  async deleteApplication(userId: string, applicationId: string): Promise<void> {
    try {
      const docRef = doc(this.getCollection(userId), applicationId);
      await deleteDoc(docRef);
    } catch (error) {
      Logger.error("Error deleting job application", error, { userId, applicationId });
      throw error;
    }
  }

  async getApplication(userId: string, applicationId: string): Promise<JobApplication | null> {
    try {
      const docRef = doc(this.getCollection(userId), applicationId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return null;

      return this.mapDocToApplication(snap);
    } catch (error) {
      Logger.error("Error getting job application", error, { userId, applicationId });
      throw error;
    }
  }

  async listApplications(userId: string): Promise<JobApplication[]> {
    try {
      const colRef = this.getCollection(userId);
      // Order by updatedAt desc by default so most recent activity is first
      const q = query(colRef, orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);

      return snap.docs.map(doc => this.mapDocToApplication(doc));
    } catch (error) {
      Logger.error("Error listing job applications", error, { userId });
      throw error;
    }
  }

  private mapDocToApplication(docSnap: import("firebase/firestore").DocumentSnapshot): JobApplication {
    const data = docSnap.data()!;

    // Convert Timestamps to Dates
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt;
    const appliedDate = data.appliedDate instanceof Timestamp ? data.appliedDate.toDate() : data.appliedDate;

    const application: JobApplication = {
      id: docSnap.id,
      userId: data.userId, // Should be present, but fallback?
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      status: data.status,
      location: data.location,
      salary: data.salary,
      url: data.url,
      notes: data.notes,
      appliedDate,
      createdAt,
      updatedAt,
    };

    // Validate at the edge
    const result = JobApplicationSchema.safeParse(application);
    if (!result.success) {
      Logger.warn(
        `Data integrity issue in JobApplication (ID: ${application.id}): ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ")}`
      );
    }

    return application;
  }
}

export const jobApplicationRepository = new JobApplicationRepository();
