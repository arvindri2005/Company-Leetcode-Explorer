## 2025-02-18 - [Seedable PRNG for Data Factories]
**Illusion:** `Math.random()` in data factories caused non-deterministic test data, making reproduction of specific data states impossible and risking flaky tests.
**Reality:** Implemented a Mulberry32-based seedable PRNG in `src/__tests__/factories/data-factories.ts` and exposed a `simpleFaker.seed()` method. This allows tests to request specific "random" data states reliably.

## 2025-02-18 - [Refactoring Hardcoded Data to Factories]
**Illusion:** Tests in `page.test.tsx` and `problem-card.test.tsx` relied on hardcoded JSON objects, leading to brittle tests that break when types change and poor coverage of optional fields.
**Reality:** Refactored these tests to use `createMockCompany` and `createMockProblem` from `@/__tests__/factories/data-factories`. This ensures all required fields are present (preventing type errors) and provides realistic defaults, while still allowing specific fields to be overridden for the test scenario.

## 2025-02-18 - [Factory Pattern for Firebase User]
**Illusion:** Tests for user profile components relied on large, hardcoded mock objects simulating Firebase User types. This led to fragility when the `User` type evolved and made tests hard to read due to noise.
**Reality:** Implemented `createMockUser` in `src/__tests__/factories/data-factories.ts` which returns a properly typed `FirebaseUser` object (using `Partial<FirebaseUser>`). It leverages `simpleFaker` for realistic data and allows granular overrides. Critically, we learned that shallow spreading overrides (`...overrides`) on nested objects (like `metadata`) can accidentally wipe out default values, requiring tests to either provide full nested objects or factories to implement deep merging.
## 2024-05-24 - [Factorization of Company Tests]
Illusion: Hardcoded JSON objects in component tests led to duplication and potential drift from types.
Reality: Implemented `createMockCompany` and `createMockProblem` factories in `src/__tests__/factories/data-factories.ts` and refactored tests to use them.
- Factory Pattern reduces noise in tests.
- Seedable PRNG ensures deterministic but realistic data.
- Overrides allow specific test scenarios while defaults handle the rest.
