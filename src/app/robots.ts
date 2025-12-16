import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

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
