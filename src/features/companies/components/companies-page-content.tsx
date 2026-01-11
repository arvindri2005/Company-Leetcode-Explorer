"use client";

import { useCallback, useEffect, useRef,useState } from "react";

import { useSearchParams } from "next/navigation";

import { HelpCircle } from "lucide-react";

import { fetchCompaniesAction } from "@/app/actions/company.actions";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { CompanyTableSkeleton } from "@/components/skeletons/companies-skeletons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { type Company } from "@/features/companies/types";

import { CompanyTable } from "./company-table";
import { DashboardHeader } from "./dashboard-header";
import { TechCompanyCard } from "./tech-company-card";


const ITEMS_PER_PAGE = 30;

interface CompaniesPageContentProps {
  initialCompanies: Company[];
  initialTrendingCompanies: Company[];
  initialHasMore: boolean;
  initialNextCursor?: string;
}

export function CompaniesPageContent({
  initialCompanies,
  initialTrendingCompanies,
  initialHasMore,
  initialNextCursor,
}: CompaniesPageContentProps) {
  const searchParams = useSearchParams();
  
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
        if (result.success && result.data) {
          setCompanies(result.data.companies);
          setHasMore(result.data.hasMore);
          setNextCursor(result.data.nextCursor);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchDetails();
  }, [searchTerm, initialCompanies, initialHasMore, initialNextCursor]);

  // Load More Function
  const loadMore = useCallback(async () => {
      if (loadingMore || !hasMore || !nextCursor) {return;}
      
      setLoadingMore(true);
      try {
          // We use Page 1 but pass cursor. The action ignores page if cursor is present for fetching, 
          // or we can pass proper page if we tracked it, but cursor is key. 
          // Action signature: (page, pageSize, term, cursor)
          const result = await fetchCompaniesAction(1, ITEMS_PER_PAGE, searchTerm, nextCursor);
          
          if (result.success && result.data) {
            setCompanies(prev => [...prev, ...result.data!.companies]);
            setHasMore(result.data.hasMore);
            setNextCursor(result.data.nextCursor);
          }
      } catch (error) {
          console.error("Failed to load more companies:", error);
      } finally {
          setLoadingMore(false);
      }
  }, [loadingMore, hasMore, nextCursor, searchTerm]);

  // Intersection Observer
  useEffect(() => {
      const currentTarget = observerTarget.current;
      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
                  loadMore();
              }
          },
          { threshold: 0.1 } // Trigger when 10% visible
      );

      if (currentTarget) {
          observer.observe(currentTarget);
      }

      return () => {
          if (currentTarget) {
              observer.unobserve(currentTarget);
          }
      };
  }, [hasMore, loadingMore, isLoading, nextCursor, searchTerm, loadMore]);

  return (
    <main className="min-h-screen w-full text-white flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1 pb-12">
        <DashboardHeader />

        {/* Trending Section - Now Full Width outside main grid */}
        {showTrending && (
          <section className="mb-12 space-y-4">
            <h2 className="text-xl font-bold text-gray-200 pl-1">Trending Companies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {initialTrendingCompanies.map((company) => (
                <TechCompanyCard key={company.id} company={company} priority={true} />
              ))}
            </div>
            <Separator className="my-8 bg-white/5" />
          </section>
        )}

        {/* Main Content Grid: List + Ads */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          {/* Main Column: Company List (Scrollable) */}
          <div className="lg:col-span-3">
            <section className="space-y-4 h-full"> 
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-bold text-gray-200">All Companies</h2>
              </div>
              
              {/* Natural flow - Page level scroll */}
              <div className="space-y-4">
                {(() => {
                  if (isLoading) {
                    return (
                      <div className="space-y-8">
                        <CompanyTableSkeleton />
                      </div>
                    );
                  }
                  if (companies.length > 0) {
                    return (
                      <div className="space-y-4">
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
                    );
                  }
                  return (
                    <div className="text-center py-12 bg-brand-surface rounded-xl border border-white/5">
                        <h2 className="text-lg font-semibold text-white mb-2">No Results</h2>
                        <p className="text-gray-400">
                        No companies found matching your criteria.
                        </p>
                    </div>
                  );
                })()}
              </div>
            </section>
          </div>

          {/* Right Sidebar: Ads Only */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-6">
                <div className="h-[300px] w-full">
                    <AdPlaceholder title="Sponsored" className="h-full" />
                </div>
                <div className="h-[300px] w-full">
                    <AdPlaceholder title="Advertisement" className="h-full" />
                </div>
            </div>
          </aside>
        </div>

        {/* About / FAQ Section - Now separate below grid */}
        {!searchTerm && (
            <section className="space-y-12 max-w-5xl mx-auto pt-8 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">
                        About Our Company Interview Questions
                        </h2>
                        <p className="text-gray-400 leading-relaxed text-lg">
                        Byte to Offer provides a collection of real interview
                        questions from top technology companies. Our platform helps software
                        engineers, data scientists, and product managers prepare effectively
                        by practicing with the actual problems asked in recent interviews.
                        </p>
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <HelpCircle className="h-5 w-5 text-teal-400" />
                        Frequently Asked Questions
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                        {/* FAQ Items */}
                        <AccordionItem value="item-1" className="border-white/10">
                            <AccordionTrigger className="text-white hover:text-teal-400 hover:no-underline">
                            What companies can I find?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            You can find interview questions for top tech companies
                            including Google, Amazon, Microsoft, Meta, Netflix, Apple,
                            Uber, Airbnb, and many more.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border-white/10">
                            <AccordionTrigger className="text-white hover:text-teal-400 hover:no-underline">
                            Are the questions real?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            Yes, our questions are collected from recent interview
                            experiences shared by candidates and verified for accuracy.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="border-b-0 border-white/10">
                            <AccordionTrigger className="text-white hover:text-teal-400 hover:no-underline">
                            How do I prepare?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                            Browse company pages, review common topics, and practice
                            specific problems listed in our curated collections.
                            </AccordionContent>
                        </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </section>
        )}
      </div>
      

    </main>
  );
}






