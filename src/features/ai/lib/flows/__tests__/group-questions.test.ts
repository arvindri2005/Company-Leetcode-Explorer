import { groupQuestions, type GroupQuestionsInput } from '../group-questions';

// Mock next/cache
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
}));

// Mock genkit
jest.mock('@/features/ai/lib/genkit', () => {
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
    const { __mockPrompt } = require('@/features/ai/lib/genkit');
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
  });

  it('should call the AI prompt with the correct input', async () => {
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

    expect(mockPrompt).toHaveBeenCalledWith(input);
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

  it('should throw an error if AI returns no output', async () => {
    mockPrompt.mockResolvedValueOnce({}); // No output

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
      'AI did not return an output for question grouping.'
    );
  });
});






