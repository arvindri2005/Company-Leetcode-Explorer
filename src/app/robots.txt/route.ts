
// src/app/robots.txt/route.ts
export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002"; // Fallback for local dev

    const robotsTxtContent = `User-agent: *
Allow: /
Disallow: /admin/ # Disallow crawling of the admin section

# Allow all crawlers to access all content by default.
# You can add specific Disallow rules if certain paths should not be crawled.
# For example:
# Disallow: /api/ # If you had sensitive API routes you didn't want indexed

Sitemap: ${appUrl}/sitemap.xml
`;

    return new Response(robotsTxtContent, {
        headers: {
            "Content-Type": "text/plain",
        },
    });
}
