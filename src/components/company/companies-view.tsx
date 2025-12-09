import { DashboardHeader } from "@/components/company/dashboard-header";
import { TechCompanyCard } from "@/components/company/tech-company-card";
import { CompanyTable } from "@/components/company/company-table";
import { companyService } from "@/services/company.service";
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

// Constants
const ITEMS_PER_PAGE = 30; // Matches data layer default
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

interface CompaniesViewProps {
  page: number;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function CompaniesView({ page, searchParams }: CompaniesViewProps) {
  const searchTerm = (searchParams?.search as string) || "";
  const currentPage = page > 0 ? page : 1;

  // Parallelize data fetching
  const companiesPromise = companyService.getCompanies({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm,
  });

  // Fetch trending companies (Google, Amazon, Microsoft)
  // Only fetch if no search term, and on page 1
  let trendingPromise: Promise<any[]> = Promise.resolve([]);
  if (!searchTerm && currentPage === 1) {
    const trendingSlugs = ["google", "amazon", "microsoft"];
    const trendingPromises = trendingSlugs.map((slug) =>
      companyService.getCompanyBySlug(slug)
    );
    trendingPromise = Promise.all(trendingPromises).then((results) =>
      results.filter((c) => c !== undefined)
    );
  }

  const [companiesResult, trendingCompaniesResult] = await Promise.all([
    companiesPromise,
    trendingPromise,
  ]);

  const {
    companies: initialCompanies,
    totalPages,
    totalCompanies,
  } = companiesResult;

  let trendingCompanies = trendingCompaniesResult;

  console.log(`[CompaniesView] Page: ${currentPage}, Search: "${searchTerm}"`);
  console.log(`[CompaniesView] Initial Companies: ${initialCompanies.length}`);
  console.log(`[CompaniesView] Trending Companies: ${trendingCompanies.length}`);

  // Fallback if specific companies aren't found (e.g. in dev env)
  if (
    !searchTerm &&
    currentPage === 1 &&
    trendingCompanies.length === 0 &&
    initialCompanies.length > 0
  ) {
    trendingCompanies = initialCompanies.slice(0, 3);
  }

  // Structured Data (JSON-LD)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Companies",
        item: `${APP_URL}/companies`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: initialCompanies.map((company, index) => ({
      "@type": "ListItem",
      position: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
      name: company.name,
      url: `${APP_URL}/company/${company.slug}`,
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
      // ... (Rest of FAQ same as before)
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


        {!searchTerm && currentPage === 1 && trendingCompanies.length > 0 && (
          <section className="mb-16 space-y-6">
            <h2 className="text-2xl font-bold">Trending Companies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingCompanies.map((company) => (
                <TechCompanyCard key={company.id} company={company} priority={true} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">All Companies</h2>
          
          {initialCompanies.length > 0 ? (
             <div className="space-y-8">
                <CompanyTable companies={initialCompanies} />
                
                <PaginationControls 
                    currentPage={currentPage}
                    totalPages={totalPages || 1}
                    baseUrl="/companies/page"
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
        {currentPage === 1 && (
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
                      {/* ... other items if needed, keeping it concise ... */}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </section>
        )}
      </div>
    </main>
  );
}
