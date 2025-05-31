import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
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
        ],
    },
    experimental: {
        allowedDevOrigins: [
            "https://6000-firebase-studio-1748324019627.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev",
        ],
    },
};

export default nextConfig;
