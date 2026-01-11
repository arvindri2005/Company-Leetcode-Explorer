import StructuredData from "@/components/seo/structured-data";
import { env } from "@/env";
import { AllProblemsList } from "@/features/problems";
import { problemService } from "@/features/problems/services/problem.service";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export default async function ProblemListContainer() {
  const problemsResult = await problemService.getAllProblemsPaginated({
    page: 1,
    pageSize: 50,
    difficultyFilter: [],
    lastAskedFilter: [],
    searchTerm: "",
    sortKey: "title",
  });

  if (!problemsResult.isSuccess) {
    throw new Error(problemsResult.error.message);
  }

  const { problems, totalPages, currentPage, hasMore, nextCursor } = problemsResult.value;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: problems.map((problem: typeof problems[0], index: number) => ({
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






