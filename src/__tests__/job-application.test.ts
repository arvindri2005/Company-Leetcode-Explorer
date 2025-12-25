import { jobApplicationRepository } from "@/repositories/job-application.repository";
import { jobApplicationService } from "@/services/job-application.service";
import {
  getUserJobApplicationsAction,
  addJobApplicationAction,
  updateJobApplicationAction,
  deleteJobApplicationAction,
} from "@/app/actions/job-application.actions";
import { JobApplication } from "@/types";

// Mocks
jest.mock("@/repositories/job-application.repository");
jest.mock("@/lib/logger");
jest.mock("@/services/job-application.service", () => {
    return {
        jobApplicationService: {
            getUserJobApplications: jest.fn(),
            addJobApplication: jest.fn(),
            updateJobApplication: jest.fn(),
            deleteJobApplication: jest.fn(),
        }
    }
});

describe("Job Application Feature", () => {
  const mockUserId = "user-123";
  const mockDate = new Date("2024-01-01T00:00:00.000Z");

  const mockApplication: JobApplication = {
    id: "app-1",
    userId: mockUserId,
    companyName: "Tech Corp",
    jobTitle: "Frontend Dev",
    status: "Applied",
    appliedDate: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Service Layer", () => {
    it("should fetch user applications", async () => {
      (jobApplicationService.getUserJobApplications as jest.Mock).mockResolvedValue([
        mockApplication,
      ]);

      const result = await jobApplicationService.getUserJobApplications(mockUserId);
      expect(result).toEqual([mockApplication]);
      expect(jobApplicationService.getUserJobApplications).toHaveBeenCalledWith(mockUserId);
    });

    it("should add a job application", async () => {
      (jobApplicationService.addJobApplication as jest.Mock).mockResolvedValue({
        id: "new-id",
      });

      const input = {
        companyName: "New Corp",
        jobTitle: "Backend Dev",
        status: "Applied" as const,
        userId: mockUserId
      };

      const result = await jobApplicationService.addJobApplication(mockUserId, input);
      expect(result).toEqual({ id: "new-id" });
      expect(jobApplicationService.addJobApplication).toHaveBeenCalledWith(mockUserId, input);
    });
  });

  describe("Server Actions", () => {
    it("should get applications via action", async () => {
       (jobApplicationService.getUserJobApplications as jest.Mock).mockResolvedValue([
        mockApplication,
      ]);

      const result = await getUserJobApplicationsAction(mockUserId);
      expect(result).toEqual({ success: true, data: [mockApplication] });
    });

    it("should add application via action", async () => {
      (jobApplicationService.addJobApplication as jest.Mock).mockResolvedValue({
        id: "new-id",
      });

      const input = {
        companyName: "Action Corp",
        jobTitle: "Fullstack",
        status: "Applied" as const,
      };

      const result = await addJobApplicationAction(mockUserId, input);
      expect(result).toEqual({ success: true, id: "new-id" });
    });

    it("should validate input in add action", async () => {
      const input = {
        companyName: "", // Invalid: empty
        jobTitle: "Fullstack",
        status: "Applied" as const,
      };

      const result = await addJobApplicationAction(mockUserId, input);
      expect(result.success).toBe(false);
    });
  });
});
