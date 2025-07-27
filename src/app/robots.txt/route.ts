// src/app/robots.txt/route.ts
export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

    const robotsTxtContent = `
# robots.txt for ${appUrl}
# Last updated: ${new Date().toISOString().split("T")[0]}
# This file tells search engines what to crawl and what to avoid

User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

# Sitemap location
Sitemap: ${appUrl}/sitemap.xml
`;

    return new Response(robotsTxtContent.trim(), {
        headers: {
            "Content-Type": "text/plain",
        },
    });
}
