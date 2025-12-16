"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Company } from "@/types";
import { DashboardHeader } from "@/components/company/dashboard-header";
import { TechCompanyCard } from "@/components/company/tech-company-card";
import { CompanyTable } from "@/components/company/company-table";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { fetchCompaniesAction } from "@/app/actions/company.actions";

const ITEMS_PER_PAGE = 30;

interface CompaniesPageContentProps {
  initialCompanies: Company[];
  initialTrendingCompanies: Company[];
  initialTotalPages: number;
  initialHasMore: boolean;
  appUrl: string;
}

export function CompaniesPageContent({
  initialCompanies,
  initialTrendingCompanies,
  initialTotalPages,
  initialHasMore,
  appUrl,
}: CompaniesPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  // Derived from URL
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const searchTerm = searchParams.get("search") || "";
  
  // Trending is static, only shown on page 1 with no search
  const showTrending = currentPage === 1 && !searchTerm && initialTrendingCompanies.length > 0;

  useEffect(() => {
    const fetchCompanies = async () => {
      // Check if we are at default state (Page 1, no search)
      // This matches the static props, so we can skip fetch and use initial
      if (currentPage === 1 && !searchTerm) {
        setCompanies(initialCompanies);
        setTotalPages(initialTotalPages);
        setHasMore(initialHasMore);
        return;
      }

      setIsLoading(true);
      try {
        const result = await fetchCompaniesAction(currentPage, ITEMS_PER_PAGE, searchTerm);
        setCompanies(result.companies);
        setTotalPages(result.totalPages);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [currentPage, searchTerm, initialCompanies, initialTotalPages, initialHasMore]);

  // JSON-LD Generation
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Companies",
        item: `${appUrl}/companies`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: companies.map((company, index) => ({
      "@type": "ListItem",
      position: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
      name: company.name,
      url: `${appUrl}/company/${company.slug}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What companies can I find interview questions for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can find interview questions for top tech companies including Google, Amazon, Microsoft, Meta, Netflix, Apple, Uber, Airbnb, and many more. We cover a wide range of companies from FAANG to startups.",
        },
      },
      {
        "@type": "Question",
        name: "Are the interview questions real?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our questions are collected from recent interview experiences shared by candidates. We verify and curate them to ensure they reflect the current interview patterns.",
        },
      },
      {
        "@type": "Question",
        name: "How can I prepare for a specific company?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can browse our company-specific pages to find curated lists of questions, interview guides, and common topics asked by that company. We also provide difficulty breakdowns and trending tags.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen w-full text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {currentPage === 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
                {showTrending && (
                <section className="mb-16 space-y-6">
                    <h2 className="text-2xl font-bold">Trending Companies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {initialTrendingCompanies.map((company) => (
                        <TechCompanyCard key={company.id} company={company} priority={true} />
                    ))}
                    </div>
                </section>
                )}

                <section className="space-y-6">
                <h2 className="text-2xl font-bold">All Companies</h2>
                
                {isLoading ? (
                    <div className="space-y-8">
                         {/* Simple loading skeleton or just verify loading behavior */}
                         <div className="w-full h-96 bg-white/5 rounded-xl animate-pulse"></div>
                    </div>
                ) : companies.length > 0 ? (
                    <div className="space-y-8">
                        <CompanyTable companies={companies} />
                        
                        <PaginationControls 
                            currentPage={currentPage}
                            totalPages={totalPages || -1}
                            baseUrl="/companies"
                            hasNextPage={hasMore}
                            // Pass empty object for searchParams to controls as we handle it via URL
                            searchParams={{ search: searchTerm, page: currentPage.toString() }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h2 className="text-lg font-semibold text-white mb-2">No Results</h2>
                        <p className="text-gray-400">
                        No companies found matching your criteria.
                        </p>
                    </div>
                )}
                </section>

                <Separator className="my-16 bg-white/10" />
                
                {/* Only show SEO content on page 1 */}
                {currentPage === 1 && !searchTerm && (
                    <section className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">
                        About Our Company Interview Questions
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                        Byte to Offer provides a comprehensive collection of real interview
                        questions from top technology companies. Our platform helps software
                        engineers, data scientists, and product managers prepare effectively
                        by practicing with the actual problems asked in recent interviews.
                        Whether you are targeting FAANG giants or innovative startups, our
                        curated lists and detailed solutions give you the edge you need to
                        succeed.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <HelpCircle className="h-6 w-6 text-primary" />
                        Frequently Asked Questions
                        </h3>
                        <Card className="border-white/10 bg-[#1A1A1A]">
                        <CardContent className="pt-6">
                            <Accordion type="single" collapsible className="w-full">
                            {/* FAQ Items */}
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-white hover:text-teal-400">
                                What companies can I find interview questions for?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-400">
                                You can find interview questions for top tech companies
                                including Google, Amazon, Microsoft, Meta, Netflix, Apple,
                                Uber, Airbnb, and many more. We cover a wide range of
                                companies from FAANG to startups.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-white hover:text-teal-400">
                                Are the interview questions real?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-400">
                                Yes, our questions are collected from recent interview
                                experiences shared by candidates. We verify and curate them
                                to ensure they reflect the current interview patterns.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-white hover:text-teal-400">
                                How can I prepare for a specific company?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-400">
                                You can browse our company-specific pages to find curated
                                lists of questions, interview guides, and common topics
                                asked by that company. We also provide difficulty breakdowns
                                and trending tags.
                                </AccordionContent>
                            </AccordionItem>
                            </Accordion>
                        </CardContent>
                        </Card>
                    </div>
                    </section>
                )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 h-[calc(100vh-8rem)] flex flex-col gap-4">
                    <div className="flex-1">
                        <AdPlaceholder title="Sponsored" className="h-full" />
                    </div>
                    <div className="flex-1">
                        <AdPlaceholder title="Advertisement" className="h-full" />
                    </div>
                </div>
            </aside>
        </div>
      </div>
    </main>
  );
}
