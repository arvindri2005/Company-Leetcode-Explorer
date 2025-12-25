# Sentry's Journal

## Reliability Gaps

### Flaky/Broken Tests
- `src/__tests__/components/ai/company-strategy-generator.test.tsx`: The test expects `getStrategyTodoListForCompanyAction` to be called on mount, but it is failing. This suggests a disconnect between the component's lifecycle and the test's expectations.
