/**
 * @fileoverview Defines the main page for listing all companies.
 *
 * This file contains the server component for the `/companies` route. It handles
 * fetching the initial, paginated list of companies, generates dynamic metadata
 * for SEO based on the current page, and renders the main company list component.
 */
import CompanyList from "@/components/company/company-list";
import Pagination from "@/components/company/pagination";
import { getCompaniesWithTotalCount } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

/**
 * Defines the props structure for the CompaniesPage, primarily for accessing search parameters.
 */
type CompaniesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

const ITEMS_PER_PAGE = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

/**
 * Dynamically generates metadata for the companies page.
 *
 * This function creates SEO-friendly metadata, including a dynamic title that
 * reflects the current page number. It also generates a canonical URL and
 * structured data (BreadcrumbList) for rich search results.
 *
 * @param {CompaniesPageProps} props - The props containing the search parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the generated metadata object.
 */
export async function generateMetadata(
  props: CompaniesPageProps,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page as string) : 1;
  const pageTitle = `Explore Companies ${page > 1 ? ` - Page ${page}` : ""}`;
  const pageDescription =
    "Browse and filter companies to find coding problems asked in their technical interviews. Prepare for your next coding interview with ByteToOffer.";
  const canonicalUrl = `${APP_URL}/companies${page > 1 ? `?page=${page}` : ""}`;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${APP_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Companies",
        item: `${APP_URL}/companies`,
      },
    ],
  };

  if (page > 1) {
    breadcrumbList.itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: `Page ${page}`,
      item: canonicalUrl,
    });
  }

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      type: "website",
      images: [{ url: `${APP_URL}/icon.png`, alt: "ByteToOffer Logo" }],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      "ld+json": JSON.stringify(breadcrumbList),
    },
  };

  // Add prev/next links for pagination
  if (page > 1) {
    (metadata.alternates as any).prev = `${APP_URL}/companies?page=${page - 1}`;
  }
  // Note: We don't know total pages here, so we can't add a 'next' link reliably
  // without another data fetch. This is a limitation to consider.

  return metadata;
}

/**
 * Renders the main page for browsing and searching companies.
 *
 * This server component is responsible for:
 * 1. Parsing the current page number and any search term from the URL's search parameters.
 * 2. Fetching the initial set of companies for the current page using `getCompaniesWithTotalCount`.
 * 3. Rendering the page structure, including a header.
 * 4. Passing the initial data down to the `CompanyList` client component, which handles
 *    client-side interactions like infinite scrolling and filtering.
 *
 * @param {CompaniesPageProps} props - The props containing the search parameters.
 * @returns {Promise<JSX.Element>} The rendered companies page.
 */
export default async function CompaniesPage(props: CompaniesPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = searchParams?.page
    ? parseInt(searchParams.page as string)
    : 1;
  const searchTerm = (searchParams?.search as string) || "";

  const {
    companies: initialCompanies,
    hasMore,
    totalPages,
    nextCursor,
  } = await getCompaniesWithTotalCount({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm,
  });

  return (
    <main
      className="min-h-screen w-full"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <section className="space-y-6 sm:space-y-8 lg:space-y-10">
          <header className="text-center sm:text-left space-y-3 sm:space-y-4">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
              itemProp="headline"
            >
              <span className="block sm:inline">Explore Companies</span>
              <span className="block sm:inline text-primary">
                {" "}
                &amp; Their Interview Problems
              </span>
            </h1>
          </header>
          <Separator className="my-6 sm:my-8" />
          <section
            className="w-full"
            itemScope
            itemType="https://schema.org/CollectionPage"
          >
            <CompanyList
              initialCompanies={initialCompanies}
              initialSearchTerm={searchTerm}
              initialHasMore={hasMore}
              initialNextCursor={nextCursor}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              totalPages={totalPages ?? 0}
            />
            <div className="sr-only">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages ?? 0}
                searchTerm={searchTerm}
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
