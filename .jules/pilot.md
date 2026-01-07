# Pilot's Log

## 2026-01-06 - CI Pipeline Reliability
Discovery: The CI pipeline (`.github/workflows/ci.yml`) has `continue-on-error: true` for both Lint and Typecheck jobs. This causes the CI to report "Success" even when there are code quality issues, eroding trust in the pipeline.
Protocol: Fix the underlying lint errors (or adjust rule severity for legacy debt) and remove the `continue-on-error` flag to enforce quality gates.

## 2026-01-06 - Missing Dependency Automation
Discovery: No Dependabot configuration found. Dependencies are updated manually.
Protocol: Add `.github/dependabot.yml` to automate security updates and dependency refresh.

## 2026-01-07 - Next.js Build Caching
Discovery: The `build-app` job in CI was rebuilding the Next.js application from scratch on every run, leading to slower feedback loops.
Protocol: Added `actions/cache` to the CI pipeline to cache `.next/cache`. This should significantly reduce build times for subsequent runs by reusing fetch cache and other build artifacts.
