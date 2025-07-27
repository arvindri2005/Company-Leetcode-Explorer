import CompanyList from "@/components/company/company-list";
import { getCompanies } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import { cache } from "react";
type CompaniesPageProps = {
    searchParams?: { [key: string]: string };
};

export const dynamic = "force-static";
export const preferredRegion = "auto";
export const revalidate = false;
export const fetchCache = "force-cache";

const ITEMS_PER_PAGE = 20;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export async function generateMetadata(): Promise<Metadata> {
    const pageTitle = "Explore Companies";
    const pageDescription =
        "Browse, search, and filter companies to find coding problems frequently asked in their technical interviews. Prepare effectively for your next coding interview with ByteToOffer.";
    const canonicalUrl = `${APP_URL}/companies`;
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
                item: canonicalUrl,
            },
        ],
    };
    return {
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
}

const getCompaniesWithCache = cache(
    async (pageSize: number, searchTerm: string) => {
        return getCompanies({
            pageSize,
            searchTerm,
        });
    }
);

export default async function CompaniesPage({
    searchParams,
}: CompaniesPageProps) {
    const {
        companies: initialCompanies,
        hasMore,
        nextCursor,
    } = await getCompaniesWithCache(ITEMS_PER_PAGE, "");

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
                            <span className="block sm:inline">
                                Explore Companies
                            </span>
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
                            initialSearchTerm={""}
                            initialHasMore={hasMore}
                            initialNextCursor={nextCursor}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </section>
                </section>
            </div>
        </main>
    );
}
