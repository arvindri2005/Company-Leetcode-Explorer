import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache the offline page
  additionalPrecacheEntries: [{ url: "/~offline", revision: "offline-v1" }],
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
};

export default withSerwist(nextConfig);
