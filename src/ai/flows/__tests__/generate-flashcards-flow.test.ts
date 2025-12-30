
import { generateFlashcardsForCompany } from '../generate-flashcards-flow';

// Define the mock implementation outside to be hoisted? No, jest.mock is hoisted above it.
// We need to use `jest.fn()` inside the factory.

jest.mock('@/ai/genkit', () => {
  const mockPromptFn = jest.fn(); // Create a fresh mock fn inside the factory scope
  
  return {
    ai: {
      definePrompt: jest.fn(() => mockPromptFn),
      defineFlow: jest.fn((config, handler) => handler),
    },
    // We can't export the variable easily here, but we can access it via the module require in the test
    __mockPrompt: mockPromptFn, 
  };
});

describe('generateFlashcardsFlow', () => {
  let mockPrompt: jest.Mock;

  beforeEach(() => {
    // Reset the mock before each test. 
    // We need to require the module to get the specific mock instance created in the factory.
    const { __mockPrompt } = require('@/ai/genkit');
    mockPrompt = __mockPrompt;
    mockPrompt.mockReset();
    mockPrompt.mockResolvedValue({
      output: {
        flashcards: [
          { front: 'Mock Front 1', back: 'Mock Back 1' },
          { front: 'Mock Front 2', back: 'Mock Back 2' },
          { front: 'Mock Front 3', back: 'Mock Back 3' },
        ],
      },
    });
  });

  it('should truncate the problems list to a maximum of 20 items', async () => {
    const problems = Array.from({ length: 30 }, (_, i) => ({
      title: `Problem ${i}`,
      difficulty: 'Medium' as const,
      tags: ['Tag'],
    }));

    const input = {
      companyName: 'Test Corp',
      problems,
    };

    await generateFlashcardsForCompany(input);

    // Check the input passed to the prompt function
    const calls = mockPrompt.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const passedInput = calls[0][0];
    
    expect(passedInput.problems).toHaveLength(20);
    expect(passedInput.companyName).toBe('Test Corp');
  });

  it('should return flashcards correctly', async () => {
    const input = {
      companyName: 'Test Corp',
      problems: [
        { title: 'Problem 1', difficulty: 'Easy' as const, tags: ['Tag'] },
      ],
    };

    const result = await generateFlashcardsForCompany(input);
    expect(result.flashcards).toHaveLength(3);
    expect(result.flashcards[0].front).toBe('Mock Front 1');
  });

  it('should return empty array if AI returns null output', async () => {
     mockPrompt.mockResolvedValueOnce({}); // No output

     const input = {
      companyName: 'Test Corp',
      problems: [
        { title: 'Problem 1', difficulty: 'Easy' as const, tags: ['Tag'] },
      ],
    };

    const result = await generateFlashcardsForCompany(input);
    expect(result.flashcards).toEqual([]);
  });
});
