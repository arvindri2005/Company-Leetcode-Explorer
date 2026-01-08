import { problemService } from "@/services/problem.service";
import { AllProblemsList } from "@/features/problems";
import StructuredData from "@/components/seo/structured-data";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export default async function ProblemListContainer() {
  const { problems, totalPages, currentPage, hasMore, nextCursor } =
    await problemService.getAllProblemsPaginated({
      page: 1,
      pageSize: 50,
      difficultyFilter: [],
      lastAskedFilter: [],
      searchTerm: "",
      sortKey: "title",
    });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: problems.map((problem, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: problem.title,
      url: problem.link, // Pointing to external link as we don't have internal detail pages
    })),
  };

  const breadcrumbSchema = {
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
        name: "Problems",
        item: `${APP_URL}/problems`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={[itemListSchema, breadcrumbSchema]} />
      <AllProblemsList
        initialProblems={problems}
        itemsPerPage={50}
        totalPages={totalPages || 1}
        currentPage={currentPage || 1}
        hasMore={hasMore}
        initialNextCursor={nextCursor}
        initialFilters={{
          difficultyFilter: [],
          lastAskedFilter: [],
          statusFilter: [],
          searchTerm: "",
          sortKey: "title",
        }}
      />
    </>
  );
}






