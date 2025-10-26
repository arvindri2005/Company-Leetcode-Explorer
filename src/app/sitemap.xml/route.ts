/**
 * @fileoverview Defines the API route for generating the `sitemap.xml` file.
 *
 * This file contains a Next.js API route handler that dynamically generates a
 * sitemap for the website. The sitemap is crucial for SEO, as it helps search
 * engines discover and index the site's pages. This route includes static public
 * pages and dynamically adds all public company detail pages.
 */
import { getAllCompanySlugs } from "@/lib/data";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

/**
 * Handles GET requests to generate the `sitemap.xml` file content.
 *
 * This function constructs an XML sitemap by:
 * 1. Defining a list of static public pages with their update frequency and priority.
 * 2. Fetching all company slugs from the database to create URLs for each dynamic company page.
 * 3. Combining these lists into a valid XML sitemap structure.
 *
 * It intentionally excludes administrative and user-specific pages.
 *
 * @returns {Promise<Response>} A response object containing the `sitemap.xml`
 * content with an `application/xml` content type.
 */
export async function GET() {
  const today = new Date().toISOString();

  const publicStaticPages = [
    { path: "/", changefreq: "monthly", priority: "0.5" },
    { path: "/companies", changefreq: "daily", priority: "1" },
    { path: "/login", changefreq: "weekly", priority: "0.5" },
    { path: "/signup", changefreq: "weekly", priority: "0.5" },
  ];

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add public static pages
  publicStaticPages.forEach((page) => {
    sitemapXml += `
  <url>
    <loc>${APP_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Add company detail pages (publicly accessible)
  try {
    const companySlugs = await getAllCompanySlugs();
    companySlugs.forEach((slug) => {
      sitemapXml += `
  <url>
    <loc>${APP_URL}/company/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  } catch (error) {
    console.error("Error fetching company slugs for sitemap:", error);
  }

  sitemapXml += `
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
