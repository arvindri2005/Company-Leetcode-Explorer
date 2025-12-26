import { companyService } from "@/services/company.service";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export async function GET() {
  const companySlugs = await companyService.getAllCompanySlugs();

  const companyUrls = companySlugs
    .map((slug) => {
      return `
    <url>
      <loc>${APP_URL}/company/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${APP_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${APP_URL}/companies</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${companyUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
