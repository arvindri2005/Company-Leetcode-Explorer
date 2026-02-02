import type { NextConfig } from "next";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    /* config options here */
    /* config options here */
    env: {
        LOGO_API: process.env.LOGO_API,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "logo.clearbit.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "img.logo.dev",
                port: "",
                pathname: "/**",
            },
        ],
    },
    serverExternalPackages: [
    'express', 
    'import-in-the-middle', 
    'require-in-the-middle',
    '@genkit-ai/core',
    '@genkit-ai/ai',
    '@genkit-ai/googleai', 
    '@genkit-ai/flow',
    'genkit'
    ],
    experimental: {
    },
    turbopack: {}
};

export default withAnalyzer(withSerwist(nextConfig));
