
import { generateProblemInsights, GenerateProblemInsightsInput } from '../generate-problem-insights-flow';
import * as genkitMock from '@/ai/genkit';

// Mock the genkit module to intercept the prompt execution.
jest.mock('@/ai/genkit', () => {
  const promptMock = jest.fn();
  return {
    ai: {
      definePrompt: jest.fn(() => promptMock),
      defineFlow: jest.fn((config, handler) => handler),
    },
    __mockPrompt: promptMock
  };
});

describe('generateProblemInsightsFlow', () => {
  // Cast to any to access the hidden mock property
  const mockPromptExecution = (genkitMock as any).__mockPrompt;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromptExecution.mockResolvedValue({
      output: {
        keyConcepts: ["Concept 1", "Concept 2"],
        commonDataStructures: ["DS 1"],
        commonAlgorithms: ["Algo 1"],
        highLevelHint: "This is a hint.",
      }
    });
  });

  it('should generate insights for valid input', async () => {
    const input: GenerateProblemInsightsInput = {
      title: 'Test Problem',
      difficulty: 'Medium',
      tags: ['Array'],
      problemDescription: 'Description of the problem.',
    };

    const result = await generateProblemInsights(input);

    expect(result).toBeDefined();
    expect(result.highLevelHint).toBe("This is a hint.");
    expect(mockPromptExecution).toHaveBeenCalledTimes(1);
  });

  it('should truncate the problem description to a maximum length', async () => {
    // Create a massive string > 2000 chars
    const longDescription = 'A'.repeat(5000);
    const input: GenerateProblemInsightsInput = {
      title: 'Massive Problem',
      difficulty: 'Hard',
      tags: ['DP'],
      problemDescription: longDescription,
    };

    await generateProblemInsights(input);

    expect(mockPromptExecution).toHaveBeenCalledTimes(1);
    const calledInput = mockPromptExecution.mock.calls[0][0];
    
    // Expect truncation (e.g., to ~2000 chars)
    expect(calledInput.problemDescription.length).toBeLessThan(5000);
    expect(calledInput.problemDescription.length).toBeLessThanOrEqual(2050); // Allowing some buffer if we add "..."
  });
});
