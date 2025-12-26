## 2025-12-25 - Centralized Config
Risk: Scattered process.env calls and hardcoded defaults led to implicit behavior and missing validation.
Protocol: Use src/env.ts with Zod validation for all config.

## 2025-12-25 - AdSense Configuration Gaps
Risk: Public IDs like AdSense Client IDs were hardcoded as fallbacks in multiple files, creating duplication and bypassing central config.
Protocol: Document even non-secret keys in .env.example and set strict defaults in schema if they are safe/public.
