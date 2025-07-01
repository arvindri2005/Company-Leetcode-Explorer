import { cn, slugify } from "../utils";

describe('slugify', () => {
  it('should convert a basic string to a slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('  Hello   World  ')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello, World!@#$%^&*()')).toBe('hello-world');
  });

  it('should handle leading/trailing spaces and hyphens', () => {
    expect(slugify('--Hello World--')).toBe('hello-world');
  });

  it('should return an empty string for an empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle numbers and mixed case', () => {
    expect(slugify('Problem 123 Test')).toBe('problem-123-test');
  });

  it('should handle strings with only special characters', () => {
    expect(slugify('!@#$%^&*')).toBe('');
  });
});

describe('cn', () => {
  it('should combine class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional class names', () => {
    expect(cn('class1', false && 'class2', true && 'class3')).toBe('class1 class3');
  });

  it('should merge tailwind classes', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('should handle empty inputs', () => {
    expect(cn('', 'class1', null, undefined)).toBe('class1');
  });

  it('should handle multiple arguments with mixed types', () => {
    expect(cn('text-red-500', 'font-bold', { 'bg-blue-200': true, 'hidden': false })).toBe('text-red-500 font-bold bg-blue-200');
  });
});
