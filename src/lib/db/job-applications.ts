
import { db } from "@/lib/firebase";
import { JobApplication, JobApplicationSchema } from "@/types";
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";

const JOB_APPLICATIONS_COLLECTION = "jobApplications";

/**
 * Converts a Firestore document snapshot into a JobApplication object.
 * @param doc - The Firestore document snapshot.
 * @returns A JobApplication object.
 */
const toJobApplication = (doc: any): JobApplication => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        appliedDate: data.appliedDate ? (data.appliedDate as Timestamp).toDate() : undefined,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
    };
};

/**
 * Adds a new job application to Firestore.
 * @param applicationData - The data for the new job application.
 * @returns The newly created JobApplication object.
 */
export const addJobApplication = async (applicationData: Omit<JobApplication, "id" | "createdAt" | "updatedAt">): Promise<JobApplication> => {
    const validatedData = JobApplicationSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(applicationData);
    
    const docRef = await addDoc(collection(db, JOB_APPLICATIONS_COLLECTION), {
        ...validatedData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    const newDoc = await getDoc(docRef);
    return toJobApplication(newDoc);
};

/**
 * Retrieves all job applications for a specific user.
 * @param userId - The ID of the user whose applications to fetch.
 * @returns An array of JobApplication objects.
 */
export const getJobApplications = async (userId: string): Promise<JobApplication[]> => {
    const q = query(collection(db, JOB_APPLICATIONS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(toJobApplication);
};

/**
 * Updates an existing job application in Firestore.
 * @param id - The ID of the job application to update.
 * @param updateData - The data to update.
 * @returns The updated JobApplication object.
 */
export const updateJobApplication = async (id: string, updateData: Partial<Omit<JobApplication, "id" | "createdAt" | "updatedAt">>): Promise<JobApplication> => {
    const docRef = doc(db, JOB_APPLICATIONS_COLLECTION, id);
    await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
    });
    
    const updatedDoc = await getDoc(docRef);
    return toJobApplication(updatedDoc);
};

/**
 * Deletes a job application from Firestore.
 * @param id - The ID of the job application to delete.
 */
export const deleteJobApplication = async (id: string): Promise<void> => {
    const docRef = doc(db, JOB_APPLICATIONS_COLLECTION, id);
    await deleteDoc(docRef);
};
