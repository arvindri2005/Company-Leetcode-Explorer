# 🏺 Relic's Journal

## 2024-05-24: Cleanup of `ts-node`
- **Discovery**: `ts-node` is present in `devDependencies` and `tsconfig.json`, but `package.json` scripts utilize `tsx`.
- **Action**: Removing `ts-node` to standardize on `tsx` and reduce dependencies.
- **Verification**: `tsx` is already the de-facto standard in this repo.
