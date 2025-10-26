import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { JobApplication } from "@/types/job-application";

const jobApplicationsCollection = collection(db, "jobApplications");

export const addJobApplication = async (
  application: Omit<JobApplication, "id" | "statusHistory">
): Promise<string> => {
  const applicationWithHistory = {
    ...application,
    statusHistory: [
      {
        status: application.status,
        date: application.dateApplied,
      },
    ],
  };
  const docRef = await addDoc(jobApplicationsCollection, applicationWithHistory);
  return docRef.id;
};

export const getJobApplications = async (
  userId: string
): Promise<JobApplication[]> => {
  const q = query(jobApplicationsCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobApplication[];
};

export const updateJobApplication = async (
  id: string,
  updates: Partial<JobApplication>
): Promise<void> => {
  const docRef = doc(db, "jobApplications", id);
  if (updates.status) {
    await updateDoc(docRef, {
      ...updates,
      statusHistory: arrayUnion({
        status: updates.status,
        date: new Date().toISOString().split("T")[0],
      }),
    });
  } else {
    await updateDoc(docRef, updates);
  }
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  const docRef = doc(db, "jobApplications", id);
  await deleteDoc(docRef);
};
