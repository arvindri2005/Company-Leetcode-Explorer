import { jobApplicationRepository } from "@/repositories/job-application.repository";
import { JobApplication, JobApplicationSchema } from "@/types";

export class JobApplicationService {
  /**
   * Fetches all job applications for a specific user.
   */
  async getUserJobApplications(userId: string): Promise<JobApplication[]> {
    return await jobApplicationRepository.getUserJobApplications(userId);
  }

  /**
   * Adds a new job application for a user.
   */
  async addJobApplication(
    userId: string,
    applicationData: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<{ id: string | null; error?: string }> {
    // Basic validation can go here if needed, beyond Zod
    return await jobApplicationRepository.addJobApplication(userId, applicationData);
  }

  /**
   * Updates an existing job application.
   */
  async updateJobApplication(
    userId: string,
    applicationId: string,
    updates: Partial<Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<{ success: boolean; error?: string }> {
    return await jobApplicationRepository.updateJobApplication(userId, applicationId, updates);
  }

  /**
   * Deletes a job application.
   */
  async deleteJobApplication(
    userId: string,
    applicationId: string
  ): Promise<{ success: boolean; error?: string }> {
    return await jobApplicationRepository.deleteJobApplication(userId, applicationId);
  }
}

export const jobApplicationService = new JobApplicationService();
