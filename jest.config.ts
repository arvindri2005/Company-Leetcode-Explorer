import nextJest from 'next/jest.js'

import type { Config } from 'jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handle module aliases - must match tsconfig.json paths exactly
    // More specific paths first, then general fallback
    '^@/components/(.*)$': '<rootDir>/src/shared/components/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/features/ai/lib/(.*)$': '<rootDir>/src/features/ai/lib/$1',
    '^@/shared/lib/(.*)$': '<rootDir>/src/shared/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/shared/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@/providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@/services/(.*)$': '<rootDir>/src/shared/services/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/domain/(.*)$': '<rootDir>/src/core/domain/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/tests/unit/factories/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
