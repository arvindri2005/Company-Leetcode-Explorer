
import { generateCompanyStrategy, GenerateCompanyStrategyInput } from '../generate-company-strategy-flow';
import * as genkitMock from '@/ai/genkit';

// Mock the genkit module to intercept the prompt execution.
// We expose a hidden property `__mockPrompt` from the mock factory
// so we can access the spy in our test body, circumventing Jest hoisting issues.
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

describe('generateCompanyStrategyFlow', () => {
  // Cast to any to access the hidden mock property
  const mockPromptExecution = (genkitMock as any).__mockPrompt;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromptExecution.mockResolvedValue({
      output: {
        preparationStrategy: "Strategy",
        focusTopics: [{ topic: "T", reason: "R" }, { topic: "T2", reason: "R2" }, { topic: "T3", reason: "R3" }],
        todoItems: [{ text: "Do this", isCompleted: false }, { text: "Do that", isCompleted: false }, { text: "Do else", isCompleted: false }],
      }
    });
  });

  it('should truncate the problems list to a maximum of 25 items', async () => {
    const problems = Array.from({ length: 50 }, (_, i) => ({
      title: `Problem ${i}`,
      difficulty: 'Easy' as const,
      tags: ['Tag'],
    }));

    const input: GenerateCompanyStrategyInput = {
      companyName: 'Test Corp',
      problems,
      targetRoleLevel: 'new_grad',
    };

    await generateCompanyStrategy(input);

    expect(mockPromptExecution).toHaveBeenCalledTimes(1);
    const calledInput = mockPromptExecution.mock.calls[0][0];
    
    // Ensure strict truncation to 25 items
    expect(calledInput.problems.length).toBeLessThanOrEqual(25);
    expect(calledInput.problems.length).toBe(25);
  });
});
