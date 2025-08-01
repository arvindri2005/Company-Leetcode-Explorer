'use server';

import {
    addJobApplication as addJobApplicationToDb,
    deleteJobApplication as deleteJobApplicationFromDb,
    updateJobApplication as updateJobApplicationInDb,
} from '@/lib/db/job-applications';
import { JobApplication, JobApplicationSchema } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Adds a new job application to the database.
 * @param applicationData - The data for the job application to add.
 * @returns Result of the operation.
 */
export async function addJobApplication(
    applicationData: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; data?: JobApplication; error?: string }> {
    try {
        const validation = JobApplicationSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(applicationData);
        if (!validation.success) {
            return { success: false, error: validation.error.flatten().fieldErrors.toString() };
        }

        const newApplication = await addJobApplicationToDb(validation.data);
        revalidatePath('/job-applications');
        return { success: true, data: newApplication };
    } catch (error) {
        console.error('Error adding job application:', error);
        return { success: false, error: 'Failed to add job application.' };
    }
}

/**
 * Updates an existing job application in the database.
 * @param id - The ID of the job application to update.
 * @param updateData - The data to update.
 * @returns Result of the operation.
 */
export async function updateJobApplication(
    id: string,
    updateData: Partial<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; data?: JobApplication; error?: string }> {
    try {
        const validation = JobApplicationSchema.partial().safeParse(updateData);
        if (!validation.success) {
            return { success: false, error: validation.error.flatten().fieldErrors.toString() };
        }

        const updatedApplication = await updateJobApplicationInDb(id, validation.data);
        revalidatePath('/job-applications');
        return { success: true, data: updatedApplication };
    } catch (error) {
        console.error('Error updating job application:', error);
        return { success: false, error: 'Failed to update job application.' };
    }
}

/**
 * Deletes a job application from the database.
 * @param id - The ID of the job application to delete.
 * @returns Result of the operation.
 */
export async function deleteJobApplication(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteJobApplicationFromDb(id);
        revalidatePath('/job-applications');
        return { success: true };
    } catch (error) {
        console.error('Error deleting job application:', error);
        return { success: false, error: 'Failed to delete job application.' };
    }
}