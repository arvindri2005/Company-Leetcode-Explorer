import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';

// Cross-platform fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          // Mock the project's AI instance
          '@/ai/genkit': path.resolve(__dirname, 'mocks/ai.ts'),
          // Mock the Genkit library itself (for 'z' exports)
          'genkit': path.resolve(__dirname, 'mocks/ai.ts'),
          // Mock Genkit plugins and core modules to prevent Node.js imports
          '@genkit-ai/googleai': path.resolve(__dirname, 'mocks/ai.ts'),
          '@genkit-ai/ai': path.resolve(__dirname, 'mocks/ai.ts'),
        },
      },
    });
  },
};
export default config;