import type { Company, LeetCodeProblem, PaginatedProblemsResponse } from "@/types";

// Simple custom "faker" implementation to avoid ESM issues
const simpleFaker = {
  string: {
    // Simple UUID v4-like generator using Math.random
    uuid: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    alphanumeric: (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    },
  },
  number: {
    int: ({ min = 0, max = 100 } = {}) => Math.floor(Math.random() * (max - min + 1)) + min,
  },
  date: {
    recent: () => new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
  },
  helpers: {
    slugify: (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    arrayElement: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  },
  lorem: {
    paragraph: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    sentence: () => "The quick brown fox jumps over the lazy dog.",
  },
  company: {
    name: () => {
      const names = ["Acme Corp", "Globex", "Soylent Corp", "Initech", "Umbrella Corp", "Stark Industries", "Wayne Enterprises"];
      return names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 1000);
    }
  },
  internet: {
    email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
    url: () => `https://example.com/${Math.random().toString(36).substring(7)}`,
  },
  word: {
    noun: () => {
      const nouns = ["algorithm", "data", "structure", "tree", "graph", "array", "string", "dynamic", "programming", "greedy"];
      return nouns[Math.floor(Math.random() * nouns.length)];
    }
  }
};

export const createMockCompany = (overrides: Partial<Company> = {}): Company => {
  const name = simpleFaker.company.name();
  const slug = simpleFaker.helpers.slugify(name);
  
  return {
    id: simpleFaker.string.uuid(),
    name,
    slug,
    normalizedName: name.toLowerCase(),
    logo: simpleFaker.internet.url(),
    description: simpleFaker.lorem.paragraph(),
    website: simpleFaker.internet.url(),
    problemCount: simpleFaker.number.int({ min: 1, max: 1000 }),
    difficultyCounts: {
      Easy: simpleFaker.number.int({ min: 1, max: 300 }),
      Medium: simpleFaker.number.int({ min: 1, max: 500 }),
      Hard: simpleFaker.number.int({ min: 1, max: 200 }),
    },
    recencyCounts: {
      last_30_days: simpleFaker.number.int({ min: 0, max: 50 }),
      within_3_months: simpleFaker.number.int({ min: 0, max: 100 }),
      within_6_months: simpleFaker.number.int({ min: 0, max: 150 }),
      older_than_6_months: simpleFaker.number.int({ min: 0, max: 500 }),
    },
    commonTags: [
      { tag: simpleFaker.word.noun(), count: simpleFaker.number.int({ min: 1, max: 50 }) },
      { tag: simpleFaker.word.noun(), count: simpleFaker.number.int({ min: 1, max: 50 }) },
    ],
    relatedCompanies: [simpleFaker.company.name(), simpleFaker.company.name()],
    statsLastUpdatedAt: simpleFaker.date.recent(),
    ...overrides,
  };
};

export const createMockProblem = (overrides: Partial<LeetCodeProblem> = {}): LeetCodeProblem => {
  const title = `Problem ${simpleFaker.number.int({ min: 1, max: 9999 })}: ${simpleFaker.lorem.sentence()}`;
  const slug = simpleFaker.helpers.slugify(title);
  const companyId = simpleFaker.string.uuid();
  const companySlug = simpleFaker.helpers.slugify(simpleFaker.company.name());

  return {
    id: simpleFaker.string.uuid(),
    title,
    slug,
    difficulty: simpleFaker.helpers.arrayElement(["Easy", "Medium", "Hard"]),
    link: simpleFaker.internet.url(),
    tags: [simpleFaker.word.noun(), simpleFaker.word.noun()],
    companyId,
    companySlug,
    companyIds: [companyId],
    companies: {
      [companyId]: { lastAskedPeriod: "last_30_days" },
    },
    problemCompanyName: simpleFaker.company.name(),
    lastAskedPeriod: "last_30_days",
    normalizedTitle: title.toLowerCase(),
    isBookmarked: false,
    currentStatus: undefined,
    ...overrides,
  };
};

export const createMockProblemsResponse = (
  overrides: Partial<PaginatedProblemsResponse> = {}
): PaginatedProblemsResponse => {
  const problems = Array.from({ length: 5 }, () => createMockProblem());
  return {
    problems,
    totalProblems: problems.length,
    hasMore: false,
    ...overrides,
  };
};
