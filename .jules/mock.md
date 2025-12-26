## 2025-02-18 - [Seedable PRNG for Data Factories]
**Illusion:** `Math.random()` in data factories caused non-deterministic test data, making reproduction of specific data states impossible and risking flaky tests.
**Reality:** Implemented a Mulberry32-based seedable PRNG in `src/__tests__/factories/data-factories.ts` and exposed a `simpleFaker.seed()` method. This allows tests to request specific "random" data states reliably.
