import { aiService } from "../ai.service";
import { Logger } from "@/lib/utils/logger";
import { groupQuestions } from "@/ai/flows/group-questions";

// Mock dependencies
jest.mock("@/lib/utils/logger");
jest.mock("@/ai/flows/group-questions");
jest.mock("@/features/problems/services/problem.service");
jest.mock("@/features/companies/services/company.service");
jest.mock("@/features/profile/services/user.service");

// Helper to check if Logger was called with specific content
const expectLog = (level: "info" | "error", messagePartial: string, contextPartial: object) => {
  const loggerMethod = Logger[level] as jest.Mock;
  const calls = loggerMethod.mock.calls;
  const found = calls.some(call => {
    const [msg, ctx] = call;
    const msgMatch = msg.includes(messagePartial);
    const ctxMatch = Object.entries(contextPartial).every(([k, v]) => ctx[k] === v);
    return msgMatch && ctxMatch;
  });
  
  if (!found) {
    console.error(`Expected log ${level} not found. Calls:`, JSON.stringify(calls, null, 2));
  }
  expect(found).toBe(true);
};

describe("AIService Observability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use manual implementation for crypto.randomUUID if not available in test env
    if (!global.crypto.randomUUID) {
      Object.defineProperty(global, 'crypto', {
        value: { randomUUID: () => 'test-uuid' },
        writable: true
      });
    }
  });

  describe("withObservability wrapper (tested via groupQuestions)", () => {
    it("logs start and success events for successful flows", async () => {
      // Arrange
      const mockProblems = [{ 
        title: "Test Problem", 
        difficulty: "Easy", 
        tags: ["Array"], 
        slug: "test-problem" 
      }];
      
      (groupQuestions as jest.Mock).mockResolvedValue({ groups: [] });

      // Act
      await aiService.groupQuestions(mockProblems as any);

      // Assert
      expect(Logger.info).toHaveBeenCalledTimes(2); // Start + Complete
      
      // Verify Start Log
      expectLog("info", "[AI] Starting groupQuestions", { 
        flowName: "groupQuestions",
        problemCount: 1 
      });

      // Verify Complete Log
      expectLog("info", "[AI] Completed groupQuestions", { 
        flowName: "groupQuestions",
        success: true
      });
    });

    it("logs error events for failed flows and rethrows", async () => {
      // Arrange
      const mockProblems = [{ 
        title: "Test Problem", 
        difficulty: "Easy", 
        tags: ["Array"], 
        slug: "test-problem" 
      }];
      const mockError = new Error("AI Service Unavailable");
      
      (groupQuestions as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(aiService.groupQuestions(mockProblems as any)).rejects.toThrow("AI Service Unavailable");

      // Verify Error Log
      expect(Logger.error).toHaveBeenCalledTimes(1);
      
      // Check that error log contains the error object and context
      const errorCalls = (Logger.error as jest.Mock).mock.calls;
      expect(errorCalls[0][0]).toContain("[AI] Failed groupQuestions");
      expect(errorCalls[0][1]).toBe(mockError); // The error object
      expect(errorCalls[0][2]).toMatchObject({
        flowName: "groupQuestions",
        success: false,
        problemCount: 1
      });
    });
  });
});






