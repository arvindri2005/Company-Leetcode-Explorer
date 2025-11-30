import { DashboardHeader } from "@/components/company/dashboard-header";
import { TechCompanyCard } from "@/components/company/tech-company-card";
import { CompanyListTable } from "@/components/company/company-list-table";
import { getCompanies, getCompanyBySlug } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

type CompaniesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const preferredRegion = "auto";

const ITEMS_PER_PAGE = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export async function generateMetadata(
  props: CompaniesPageProps,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page as string) : 1;
  const pageTitle = `Top Tech Companies Interview Questions & Prep${page > 1 ? ` - Page ${page}` : ""} | Byte to Offer`;
  const pageDescription =
    "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more. Access company-specific guides, interview patterns, and coding problems.";
  const canonicalUrl = `${APP_URL}/companies${page > 1 ? `?page=${page}` : ""}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      "Tech Company Interview Questions",
      "Google Interview Prep",
      "Amazon SDE Interview",
      "Microsoft Coding Questions",
      "Meta Interview Questions",
      "Software Engineer Interview",
      "Coding Interview Practice",
      "FAANG Interview Prep",
      "Byte to Offer Companies",
      "System Design Interview",
      "Frontend Interview Questions",
      "Backend Interview Questions",
      "Full Stack Interview",
      "Coding Challenges",
      "Algorithm Practice",
    ],
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
  };
}

export default async function CompaniesPage(props: CompaniesPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = searchParams?.page
    ? parseInt(searchParams.page as string)
    : 1;
  const searchTerm = (searchParams?.search as string) || "";

  // Parallelize data fetching
  const companiesPromise = getCompanies({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm,
  });

  // Fetch trending companies (Google, Amazon, Microsoft)
  // Only fetch if no search term is present, to keep the UI clean during search
  let trendingPromise: Promise<any[]> = Promise.resolve([]);
  if (!searchTerm) {
    const trendingSlugs = ["google", "amazon", "microsoft"];
    const trendingPromises = trendingSlugs.map((slug) =>
      getCompanyBySlug(slug),
    );
    trendingPromise = Promise.all(trendingPromises).then((results) =>
      results.filter((c) => c !== undefined),
    );
  }

  const [companiesResult, trendingCompaniesResult] = await Promise.all([
    companiesPromise,
    trendingPromise,
  ]);

  const {
    companies: initialCompanies,
    hasMore,
    nextCursor,
  } = companiesResult;

  let trendingCompanies = trendingCompaniesResult;

  // Fallback if specific companies aren't found (e.g. in dev env)
  if (
    !searchTerm &&
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
      position: index + 1,
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
      {
        "@type": "Question",
        name: "Is Byte to Offer free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Byte to Offer provides free access to a vast collection of interview questions and company guides to help you prepare for your dream job.",
        },
      },
      {
        "@type": "Question",
        name: "Do you provide detailed solutions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we provide detailed solutions and explanations for many of our coding problems to help you understand the core concepts and optimal approaches.",
        },
      },
      {
        "@type": "Question",
        name: "How often are the questions updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We regularly update our question bank based on recent interview experiences shared by the community to ensure you have the most current information.",
        },
      },
      {
        "@type": "Question",
        name: "Can I practice coding directly on the platform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Currently, we focus on providing the best curated questions and resources. We recommend using your preferred local IDE or online compilers for practice to simulate a real coding environment.",
        },
      },
    ],
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Top Tech Companies Interview Questions & Prep",
    description: "Prepare for your next software engineering interview with real questions from top tech companies.",
    url: `${APP_URL}/companies`,
    isPartOf: {
      "@type": "Website",
      name: "Byte to Offer",
      url: APP_URL,
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <DashboardHeader />

        {!searchTerm && trendingCompanies.length > 0 && (
          <section className="mb-16 space-y-6">
            <h2 className="text-2xl font-bold">Trending Companies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingCompanies.map((company) => (
                <TechCompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">All Companies</h2>
          <CompanyListTable
            initialCompanies={initialCompanies}
            initialHasMore={hasMore}
            initialNextCursor={nextCursor}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </section>

        <Separator className="my-16 bg-white/10" />

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
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-white hover:text-teal-400">
                      Is Byte to Offer free to use?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      Yes, Byte to Offer provides free access to a vast collection
                      of interview questions and company guides to help you
                      prepare for your dream job.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-white hover:text-teal-400">
                      Do you provide detailed solutions?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      Yes, we provide detailed solutions and explanations for many
                      of our coding problems to help you understand the core
                      concepts and optimal approaches.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger className="text-white hover:text-teal-400">
                      How often are the questions updated?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      We regularly update our question bank based on recent
                      interview experiences shared by the community to ensure you
                      have the most current information.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7">
                    <AccordionTrigger className="text-white hover:text-teal-400">
                      Can I practice coding directly on the platform?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      Currently, we focus on providing the best curated questions
                      and resources. We recommend using your preferred local IDE
                      or online compilers for practice to simulate a real coding
                      environment.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
