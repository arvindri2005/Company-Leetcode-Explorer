import { groupQuestions, GroupQuestionsInput } from '../group-questions';
import { groupQuestionsCache } from '@/ai/cache';

// Mock next/cache
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
}));

// Mock genkit
jest.mock('@/ai/genkit', () => {
  const mockPromptFn = jest.fn();
  return {
    ai: {
      definePrompt: jest.fn(() => mockPromptFn),
      defineFlow: jest.fn((config, handler) => handler),
    },
    __mockPrompt: mockPromptFn,
  };
});

describe('groupQuestions', () => {
  let mockPrompt: jest.Mock;

  beforeEach(() => {
    const { __mockPrompt } = require('@/ai/genkit');
    mockPrompt = __mockPrompt;
    mockPrompt.mockReset();
    mockPrompt.mockResolvedValue({
      output: {
        groups: [
          {
            groupName: 'Arrays',
            questions: [
              {
                title: 'Two Sum',
                difficulty: 'Easy',
                link: 'https://leetcode.com/problems/two-sum',
                tags: ['Array', 'Hash Table'],
              },
            ],
          },
        ],
      },
    });
    groupQuestionsCache.clear();
  });

  it('should call the AI prompt with the safe input', async () => {
    const input: GroupQuestionsInput = {
      questions: [
        {
          title: 'Two Sum',
          difficulty: 'Easy',
          link: 'https://leetcode.com/problems/two-sum',
          tags: ['Array', 'Hash Table'],
        },
      ],
    };

    await groupQuestions(input);

    // Expect the prompt to be called with the object structure that has 'questions'
    // and verify truncation/sanitization logic if applied.
    // In this case, "Two Sum" is short so it won't be truncated.
    expect(mockPrompt).toHaveBeenCalledWith({
      questions: [
        {
            title: 'Two Sum',
            difficulty: 'Easy',
            link: 'https://leetcode.com/problems/two-sum',
            tags: ['Array', 'Hash Table'],
        }
      ]
    });
  });

  it('should return grouped questions correctly', async () => {
    const input: GroupQuestionsInput = {
      questions: [
        {
          title: 'Two Sum',
          difficulty: 'Easy',
          link: 'https://leetcode.com/problems/two-sum',
          tags: ['Array', 'Hash Table'],
        },
      ],
    };

    const result = await groupQuestions(input);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].groupName).toBe('Arrays');
    expect(result.groups[0].questions).toHaveLength(1);
    expect(result.groups[0].questions[0].title).toBe('Two Sum');
  });

  it('should throw an error if AI returns no output after retries', async () => {
    // Mock the prompt to always return empty/invalid output to trigger retries and final failure
    mockPrompt.mockResolvedValue({});

    const input: GroupQuestionsInput = {
        questions: [
          {
            title: 'Two Sum',
            difficulty: 'Easy',
            link: 'https://leetcode.com/problems/two-sum',
            tags: ['Array', 'Hash Table'],
          },
        ],
      };

    await expect(groupQuestions(input)).rejects.toThrow(
      'AI did not return a valid grouping output.'
    );
  });
});
