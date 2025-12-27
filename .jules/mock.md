## 2025-02-18 - [Seedable PRNG for Data Factories]
**Illusion:** `Math.random()` in data factories caused non-deterministic test data, making reproduction of specific data states impossible and risking flaky tests.
**Reality:** Implemented a Mulberry32-based seedable PRNG in `src/__tests__/factories/data-factories.ts` and exposed a `simpleFaker.seed()` method. This allows tests to request specific "random" data states reliably.

## 2025-02-18 - [Refactoring Hardcoded Data to Factories]
**Illusion:** Tests in `page.test.tsx` and `problem-card.test.tsx` relied on hardcoded JSON objects, leading to brittle tests that break when types change and poor coverage of optional fields.
**Reality:** Refactored these tests to use `createMockCompany` and `createMockProblem` from `@/__tests__/factories/data-factories`. This ensures all required fields are present (preventing type errors) and provides realistic defaults, while still allowing specific fields to be overridden for the test scenario.
