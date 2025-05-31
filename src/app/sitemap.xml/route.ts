
import { getAllCompanySlugs, getAllProblemCompanyAndProblemSlugs } from '@/lib/data';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; // Fallback for local dev

export async function GET() {
  const today = new Date().toISOString();

  const staticPages = [
    '/',
    '/companies',
    '/submit-problem',
    '/add-company',
    '/bulk-add-problems',
    '/bulk-add-companies',
    '/login',
    '/signup',
    '/profile',
  ];

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(path => {
    sitemapXml += `
  <url>
    <loc>${APP_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${path === '/' || path === '/companies' ? 'daily' : 'weekly'}</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/companies' ? '0.9' : '0.7'}</priority>
  </url>`;
  });

  // Add company detail pages
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
  
  // Add mock interview pages
  try {
    const problemSlugsData = await getAllProblemCompanyAndProblemSlugs();
    problemSlugsData.forEach(({ companySlug, problemSlug }) => {
      sitemapXml += `
  <url>
    <loc>${APP_URL}/mock-interview/${companySlug}/${problemSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
  } catch (error) {
    console.error("Error fetching problem slugs for sitemap:", error);
  }


  sitemapXml += `
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
