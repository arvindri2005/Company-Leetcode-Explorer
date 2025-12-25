"use server";

import { jobApplicationService } from "@/services/job-application.service";
import { JobApplicationSchema } from "@/types";
import { handleServerActionError } from "@/lib/error-handler";
import { z } from "zod";

// Zod schema for adding an application (without system fields)
const AddJobApplicationSchema = JobApplicationSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Zod schema for updating an application
const UpdateJobApplicationSchema = JobApplicationSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/**
 * Server action to get all job applications for a user.
 */
export async function getUserJobApplicationsAction(userId: string) {
  try {
    const applications = await jobApplicationService.getUserJobApplications(userId);
    return { success: true, data: applications };
  } catch (error) {
    const message = handleServerActionError(error, "Failed to fetch job applications.");
    return { success: false, error: message };
  }
}

/**
 * Server action to add a new job application.
 */
export async function addJobApplicationAction(
  userId: string,
  data: z.infer<typeof AddJobApplicationSchema>
) {
  try {
    // Validate input
    const validatedData = AddJobApplicationSchema.parse(data);

    /**
     * SENTINEL SECURITY WARNING: IDOR VULNERABILITY
     *
     * This action accepts `userId` directly from the client without server-side verification against an authenticated session.
     * This allows any user to potentially create/modify records for other users.
     *
     * Reason: The project relies on the Firebase Client SDK for Firestore interactions, and `firebase-admin` is not available
     * to verify ID tokens on the server securely.
     *
     * Mitigation Strategy (Future):
     * 1. Integrate `firebase-admin` to verify the `Authorization` header or session cookie.
     * 2. Extract `uid` from the verified token instead of accepting it as an argument.
     *
     * Current Status: Acknowledged Technical Debt/Risk.
     */

    const result = await jobApplicationService.addJobApplication(userId, validatedData);

    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, id: result.id };
  } catch (error) {
    const message = handleServerActionError(error, "Failed to add job application.");
    return { success: false, error: message };
  }
}

/**
 * Server action to update a job application.
 */
export async function updateJobApplicationAction(
  userId: string,
  applicationId: string,
  updates: z.infer<typeof UpdateJobApplicationSchema>
) {
  try {
    // Validate input
    const validatedUpdates = UpdateJobApplicationSchema.parse(updates);

    const result = await jobApplicationService.updateJobApplication(
      userId,
      applicationId,
      validatedUpdates
    );

    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error) {
    const message = handleServerActionError(error, "Failed to update job application.");
    return { success: false, error: message };
  }
}

/**
 * Server action to delete a job application.
 */
export async function deleteJobApplicationAction(
  userId: string,
  applicationId: string
) {
  try {
    const result = await jobApplicationService.deleteJobApplication(userId, applicationId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error) {
    const message = handleServerActionError(error, "Failed to delete job application.");
    return { success: false, error: message };
  }
}
