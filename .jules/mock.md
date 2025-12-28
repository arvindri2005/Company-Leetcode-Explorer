# Mocking Strategies

## Jest Hoisting & Module Mocks

**Date**: 2024-05-23
**Context**: Testing Genkit AI flows where `definePrompt` is called at module load time.

### The Problem
When testing a file that calls `ai.definePrompt` at the top level, we need to mock `ai.definePrompt` to return a spy function that we can assert on. However, because Jest mocks are hoisted, we cannot create a spy variable in the test scope and use it in the mock factory directly if it's a `const`.

### The Solution: Exposed Hidden Property
Instead of trying to inject a spy from the outside, we create the spy *inside* the mock factory and expose it via a hidden property on the mocked module.

```typescript
// Test File
import * as mockedModule from '@/path/to/module';

jest.mock('@/path/to/module', () => {
  const internalSpy = jest.fn();
  return {
    ...jest.requireActual('@/path/to/module'),
    someFunction: jest.fn(() => internalSpy),
    // Expose the spy for the test to use
    __internalSpy: internalSpy
  };
});

describe('My Test', () => {
  const spy = (mockedModule as any).__internalSpy;

  it('works', () => {
    // Now we can assert on the spy that was used inside the module
    expect(spy).toHaveBeenCalled();
  });
});
```

This pattern ensures that the exact function instance returned by the mock factory is the one we are asserting on in the test.
