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
});
