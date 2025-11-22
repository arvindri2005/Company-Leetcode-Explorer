/**
 * @fileoverview Defines the API route for generating the `robots.txt` file.
 *
 * This file contains a Next.js API route handler that dynamically generates
 * the `robots.txt` file for the website. This file provides instructions to
 * web crawlers (like search engine bots) about which pages or files the
 * crawler can or cannot request from the site.
 */

/**
 * Handles GET requests to generate the `robots.txt` file content.
 *
 * This function creates the content for the `robots.txt` file, which includes
 * rules for all user agents (`User-agent: *`). It disallows crawling of administrative
 * areas, API routes, Next.js internal folders, and the problem submission page.
 * It explicitly allows crawling of all other pages and provides the location
 * of the sitemap.
 *
 * @returns {Promise<Response>} A response object containing the `robots.txt`
 * content with a `text/plain` content type.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

  const robotsTxtContent = `
# robots.txt for ${appUrl}
# Last updated: ${new Date().toISOString().split("T")[0]}
# This file tells search engines what to crawl and what to avoid

User-agent: *
Disallow: /api/
Disallow: /_next/
Disallow: /submit-problem?*
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
