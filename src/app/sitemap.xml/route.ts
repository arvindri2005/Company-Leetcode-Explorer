
import { getAllCompanySlugs } from '@/lib/data';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; // Fallback for local dev

export async function GET() {
  const today = new Date().toISOString();

  const publicStaticPages = [
    { path: '/', changefreq: 'monthly', priority: '0.5' },
    { path: '/companies', changefreq: 'daily', priority: '1' },
    { path: '/login', changefreq: 'weekly', priority: '0.5' },
    { path: '/signup', changefreq: 'weekly', priority: '0.5' },
    // Removed: /bulk-add-companies, /bulk-add-problems as they are now admin routes
  ];

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add public static pages
  publicStaticPages.forEach(page => {
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
    companySlugs.forEach(slug => {
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
  
  // Admin pages, mock interview pages, profile, submit-problem, add-company are excluded.
  // Admin pages will be disallowed by robots.txt.

  sitemapXml += `
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
