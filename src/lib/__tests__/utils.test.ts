import { parseArrayValid } from '../utils';

describe('parseArrayValid', () => {
  const validValues = ['a', 'b', 'c'];

  it('should return only valid values', () => {
    const input = ['a', 'x', 'b', 'y', 'c'];
    const result = parseArrayValid(input, validValues);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array if input is null', () => {
    const result = parseArrayValid(null, validValues);
    expect(result).toEqual([]);
  });

  it('should return empty array if input is empty', () => {
    const result = parseArrayValid([], validValues);
    expect(result).toEqual([]);
  });

  it('should preserve order of valid values found in input', () => {
    const input = ['c', 'a'];
    const result = parseArrayValid(input, validValues);
    expect(result).toEqual(['c', 'a']);
  });

  it('should handle generic types correctly', () => {
    const difficultyValues = ['Easy', 'Medium', 'Hard'] as const;
    const input = ['Easy', 'SuperHard', 'Medium'];
    const result = parseArrayValid(input, [...difficultyValues]);
    expect(result).toEqual(['Easy', 'Medium']);
  });
});
