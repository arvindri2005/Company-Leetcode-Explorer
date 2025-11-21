import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
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
};

export default nextConfig;
