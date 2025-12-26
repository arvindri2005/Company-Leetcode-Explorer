
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/security/**/*.test.ts'],
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
