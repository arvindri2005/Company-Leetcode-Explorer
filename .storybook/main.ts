import type { StorybookConfig } from '@storybook/nextjs';

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
  "framework": "@storybook/nextjs",
  "staticDirs": [
    "..\\public"
  ],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "raw-body": false,
        "crypto": false,
        "stream": false,
        "vm": false,
        "fs": false,
        "os": false,
        "path": false,
        "child_process": false,
        "node-domexception": false,
        "net": false,
        "tls": false,
        "zlib": false,
        "perf_hooks": false,
        "on-finished": false,
        "dgram": false,
        "async_hooks": false,
        "http2": false,
        "dns": false,
        "node:async_hooks": false,
        "node:buffer": false,
        "node:fs": false,
        "node:https": false,
        "node:http": false,
        "node:net": false,
        "node:path": false,
        "node:perf_hooks": false,
        "node:process": false,
        "node:stream": false,
        "node:stream/web": false,
      };
    }
    return config;
  },
};
export default config;