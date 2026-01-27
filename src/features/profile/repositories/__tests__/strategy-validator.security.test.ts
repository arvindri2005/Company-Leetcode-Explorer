import { SharedValidatorsImpl } from '../shared/validators';
// Mock Logger
jest.mock('@/lib/utils/logger', () => ({
  Logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SharedValidatorsImpl Security', () => {
  let validators: SharedValidatorsImpl;
  const userId = 'user-security-test';

  const validStrategyData = {
    companyId: 'company-1',
    companyName: 'Test Company',
    savedAt: new Date(),
    preparationStrategy: 'Valid strategy text',
    focusTopics: [
      { topic: 'Valid Topic', reason: 'Valid Reason' }
    ],
    items: [
      { text: 'Valid Todo', isCompleted: false }
    ]
  };

  beforeEach(() => {
    validators = new SharedValidatorsImpl();
    jest.clearAllMocks();
  });

  it('should validate valid strategy data', () => {
    const result = validators.validateStrategyData(validStrategyData, userId);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject XSS in companyName', () => {
    const maliciousData = {
      ...validStrategyData,
      companyName: 'Evil <script>alert(1)</script>'
    };
    const result = validators.validateStrategyData(maliciousData, userId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Input contains invalid characters');
  });

  it('should reject XSS in preparationStrategy', () => {
    const maliciousData = {
      ...validStrategyData,
      preparationStrategy: 'Evil <img src=x onerror=alert(1)>'
    };
    const result = validators.validateStrategyData(maliciousData, userId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Input contains invalid characters');
  });

  it('should reject XSS in focusTopics topic', () => {
    const maliciousData = {
      ...validStrategyData,
      focusTopics: [
        { topic: 'Evil <svg/onload=alert(1)>', reason: 'Valid Reason' }
      ]
    };
    const result = validators.validateStrategyData(maliciousData, userId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Input contains invalid characters');
  });

  it('should reject XSS in focusTopics reason', () => {
    const maliciousData = {
      ...validStrategyData,
      focusTopics: [
        { topic: 'Valid Topic', reason: 'Evil <iframe src="javascript:alert(1)">' }
      ]
    };
    const result = validators.validateStrategyData(maliciousData, userId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Input contains invalid characters');
  });

  it('should reject XSS in todo items text', () => {
    const maliciousData = {
      ...validStrategyData,
      items: [
        { text: 'Evil <script>alert(1)</script>', isCompleted: false }
      ]
    };
    const result = validators.validateStrategyData(maliciousData, userId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Input contains invalid characters');
  });
});
