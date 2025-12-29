import { JobApplication, JobApplicationSchema } from "@/types/job-application";
import { jobApplicationRepository } from "@/repositories/job-application.repository";
import { Logger } from "@/lib/logger";

export class JobApplicationService {
  async addApplication(
    userId: string,
    data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ) {
    // Validate input (though the repo validation at edge handles read, we should validate write too)
    // We construct a partial object to validate against the schema's relevant parts
    // Actually, let's just trust the repository to handle the DB op, but we should validate business logic here.

    // For now, simple pass-through with logging
    try {
      const id = await jobApplicationRepository.addApplication(userId, data);
      Logger.info("Job Application created", { userId, applicationId: id });
      return id;
    } catch (error) {
      Logger.error("Failed to create job application", error, { userId });
      throw error;
    }
  }

  async updateApplication(
    userId: string,
    applicationId: string,
    data: Partial<Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">>
  ) {
    try {
      await jobApplicationRepository.updateApplication(userId, applicationId, data);
      Logger.info("Job Application updated", { userId, applicationId });
    } catch (error) {
      Logger.error("Failed to update job application", error, { userId, applicationId });
      throw error;
    }
  }

  async deleteApplication(userId: string, applicationId: string) {
    try {
      await jobApplicationRepository.deleteApplication(userId, applicationId);
      Logger.info("Job Application deleted", { userId, applicationId });
    } catch (error) {
      Logger.error("Failed to delete job application", error, { userId, applicationId });
      throw error;
    }
  }

  async getApplication(userId: string, applicationId: string) {
    return await jobApplicationRepository.getApplication(userId, applicationId);
  }

  async listApplications(userId: string) {
    return await jobApplicationRepository.listApplications(userId);
  }
}

export const jobApplicationService = new JobApplicationService();
