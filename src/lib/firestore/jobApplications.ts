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
} from "firebase/firestore";
import { JobApplication } from "@/types/job-application";

const jobApplicationsCollection = collection(db, "jobApplications");

export const addJobApplication = async (
  application: Omit<JobApplication, "id">
): Promise<string> => {
  const docRef = await addDoc(jobApplicationsCollection, application);
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
  await updateDoc(docRef, updates);
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  const docRef = doc(db, "jobApplications", id);
  await deleteDoc(docRef);
};
