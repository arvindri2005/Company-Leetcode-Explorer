"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { fetchCompaniesAction } from "@/app/actions/company.actions";

const ITEMS_PER_PAGE = 30;

interface CompaniesPageContentProps {
  initialCompanies: Company[];
  initialTrendingCompanies: Company[];
  initialTotalPages: number;
  initialHasMore: boolean;
  initialNextCursor?: string;
  appUrl: string;
}

export function CompaniesPageContent({
  initialCompanies,
  initialTrendingCompanies,
  initialTotalPages,
  initialHasMore,
  initialNextCursor,
  appUrl,
}: CompaniesPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter(); // Keep for navigation if needed, but we don't sync page to URL anymore
  
  // State
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Derived from URL
  const searchTerm = searchParams.get("search") || "";
  
  // Trending is static, only shown when no search is active
  const showTrending = !searchTerm && initialTrendingCompanies.length > 0;

  // Refs for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset state when search changes
  useEffect(() => {
    // If we are back to initial state (no search), and initialCompanies matches, we could reset.
    // simpler: Fetch fresh list for new search term.
    
    // Define async fetch inside effect
    const fetchSearchDetails = async () => {
      if (!searchTerm && initialCompanies.length > 0) {
          // Reset to initial props if search cleared
          setCompanies(initialCompanies);
          setHasMore(initialHasMore);
          setNextCursor(initialNextCursor);
          return;
      }
      
      setIsLoading(true);
      try {
        // Fetch first page of search results
        const result = await fetchCompaniesAction(1, ITEMS_PER_PAGE, searchTerm);
        setCompanies(result.companies);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchDetails();
  }, [searchTerm, initialCompanies, initialHasMore, initialNextCursor]);

  // Load More Function
  const loadMore = async () => {
      if (loadingMore || !hasMore || !nextCursor) return;
      
      setLoadingMore(true);
      try {
          // We use Page 1 but pass cursor. The action ignores page if cursor is present for fetching, 
          // or we can pass proper page if we tracked it, but cursor is key. 
          // Action signature: (page, pageSize, term, cursor)
          const result = await fetchCompaniesAction(1, ITEMS_PER_PAGE, searchTerm, nextCursor);
          
          setCompanies(prev => [...prev, ...result.companies]);
          setHasMore(result.hasMore);
          setNextCursor(result.nextCursor);
      } catch (error) {
          console.error("Failed to load more companies:", error);
      } finally {
          setLoadingMore(false);
      }
  };

  // Intersection Observer
  useEffect(() => {
      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
                  loadMore();
              }
          },
          { threshold: 0.1 } // Trigger when 10% visible
      );

      if (observerTarget.current) {
          observer.observe(observerTarget.current);
      }

      return () => {
          if (observerTarget.current) {
              observer.unobserve(observerTarget.current);
          }
      };
  }, [hasMore, loadingMore, isLoading, nextCursor, searchTerm]);

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
      position: index + 1,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Show FAQ SEO only on initial load / no search to avoid duplicates or issues */}
      {!searchTerm && (
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
                         {/* Simple loading skeleton */}
                         <div className="w-full h-96 bg-white/5 rounded-xl animate-pulse"></div>
                    </div>
                ) : companies.length > 0 ? (
                    <div className="space-y-8">
                        <CompanyTable companies={companies} />
                        
                        {/* Loading trigger / Sentinel */}
                        {hasMore && (
                            <div 
                                ref={observerTarget} 
                                className="w-full py-8 flex justify-center items-center"
                            >
                                {loadingMore ? (
                                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <div className="h-4 w-4"></div> /* Invisible target to trigger load */
                                )}
                            </div>
                        )}
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
                
                <Separator className="my-16 bg-white/10" />
                
                {/* Only show SEO content on initial non-search view */}
                {!searchTerm && (
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
