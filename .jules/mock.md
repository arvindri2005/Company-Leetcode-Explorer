## 2024-05-24 - Refactoring to Factories
Illusion: Hardcoded test data objects (like `mockCompany`) in component tests create maintenance overhead and hide the essential properties being tested.
Reality: Replacing these with a `createMockCompany` factory allows tests to focus only on relevant overrides (e.g., `difficultyCounts` for stats tests) while ensuring a valid, type-safe default state. This reduces boilerplate by ~60% in test files and prevents "drift" where test objects become invalid against the TypeScript interface over time.

## 2024-05-24 - Schema Validation Factories
Illusion: Schema validation tests often use hardcoded, partially-valid objects, making it hard to test the schema's resilience to random or unexpected inputs.
Reality: Introducing a dedicated factory (e.g., `createMockUserProfile`) that generates fully valid, randomized data allows schema tests to start from a "green" state and only mutate specific fields to test failure conditions. This ensures that a failure is due to the specific mutation, not an accidental omission in the base object.
