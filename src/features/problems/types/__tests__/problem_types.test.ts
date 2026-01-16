import { describe, expect,it } from '@jest/globals';

import { LeetCodeProblemSchema } from '../problem.types';

describe('LeetCodeProblemSchema', () => {
  it('should reject javascript: protocol in link', () => {
    const maliciousProblem = {
      id: '1',
      title: 'Test',
      difficulty: 'Easy',
      link: 'javascript:alert(1)',
      tags: [],
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'test',
    };

    const result = LeetCodeProblemSchema.safeParse(maliciousProblem);
    // This expectation is set to fail if the vulnerability exists
    expect(result.success).toBe(false);
  });

  it('should accept http/https protocols', () => {
    const validProblem = {
      id: '1',
      title: 'Test',
      difficulty: 'Easy',
      link: 'https://leetcode.com/problems/two-sum/',
      tags: [],
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'test',
    };

    const result = LeetCodeProblemSchema.safeParse(validProblem);
    expect(result.success).toBe(true);
  });

  it('should reject titles with control characters', () => {
    const problemWithBadTitle = {
      id: '1',
      title: 'Test\x00Title', // Contains null byte
      difficulty: 'Easy',
      link: 'https://example.com',
      tags: [],
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'test',
    };

    const result = LeetCodeProblemSchema.safeParse(problemWithBadTitle);
    expect(result.success).toBe(false);
  });

  it('should reject tags with special characters', () => {
    const problemWithBadTags = {
      id: '1',
      title: 'Test',
      difficulty: 'Easy',
      link: 'https://example.com',
      tags: ['<script>'], // Dangerous tag
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'test',
    };

    const result = LeetCodeProblemSchema.safeParse(problemWithBadTags);
    expect(result.success).toBe(false);
  });

  it('should accept tags with valid characters', () => {
    const problemWithGoodTags = {
      id: '1',
      title: 'Test',
      difficulty: 'Easy',
      link: 'https://example.com',
      tags: ['C++', 'C#', 'Dynamic Programming', 'Array', 'Map.Entry'],
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'test',
    };

    const result = LeetCodeProblemSchema.safeParse(problemWithGoodTags);
    expect(result.success).toBe(true);
  });

  it('should reject normalizedTitle with uppercase', () => {
    const problemWithBadNormTitle = {
      id: '1',
      title: 'Test',
      difficulty: 'Easy',
      link: 'https://example.com',
      tags: [],
      companyId: '1',
      companySlug: 'company',
      slug: 'test',
      normalizedTitle: 'Test Title', // Uppercase not allowed
    };

    const result = LeetCodeProblemSchema.safeParse(problemWithBadNormTitle);
    expect(result.success).toBe(false);
  });
});
