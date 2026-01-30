import { aiFlowRegistry } from "@/ai/flow-registry";
import { aiService } from "@/ai/services/ai.service";
import { type AIProblemInput } from "@/shared/types";

describe("AI Flow Registry and Service Extensibility", () => {
  const originalGroupQuestionsFlow = aiFlowRegistry.get("groupQuestions");

  afterEach(() => {
    // Restore original flow
    if (originalGroupQuestionsFlow) {
        aiFlowRegistry.register("groupQuestions", originalGroupQuestionsFlow);
    }
  });

  it("should allow registering and using a mock flow", async () => {
    const mockOutput = {
      groups: [
        {
          groupName: "Mock Group",
          questions: [
            {
              title: "Mock Problem",
              difficulty: "Easy" as const,
              link: "http://example.com",
              tags: ["mock"],
            },
          ],
        },
      ],
    };

    // Register a mock flow
    const mockFlow = jest.fn().mockResolvedValue(mockOutput);
    aiFlowRegistry.register("groupQuestions", mockFlow);

    // Verify registry has it
    expect(aiFlowRegistry.get("groupQuestions")).toBe(mockFlow);

    // Call service method which should use the mock flow
    const input: AIProblemInput[] = [
      {
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        tags: ["Array"],
        link: "http://example.com/two-sum",
      },
    ];

    const result = await aiService.groupQuestions(input);

    // Assertions
    expect(mockFlow).toHaveBeenCalled();
    expect(result).toEqual(mockOutput);
  });
  
  it("should throw error if flow is not found", () => {
      expect(() => aiFlowRegistry.get("nonExistentFlow")).toThrow("AI Flow 'nonExistentFlow' not found");
  });
});






