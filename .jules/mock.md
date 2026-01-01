## 2024-05-24 - Refactoring to Factories
Illusion: Hardcoded test data objects (like `mockCompany`) in component tests create maintenance overhead and hide the essential properties being tested.
Reality: Replacing these with a `createMockCompany` factory allows tests to focus only on relevant overrides (e.g., `difficultyCounts` for stats tests) while ensuring a valid, type-safe default state. This reduces boilerplate by ~60% in test files and prevents "drift" where test objects become invalid against the TypeScript interface over time.
