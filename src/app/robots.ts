import { MetadataRoute } from "next";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "AggressiveBot",
        disallow: "/_next/",
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}



