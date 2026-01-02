import { problemService } from "@/services/problem.service";
import AllProblemsList from "@/components/problem/all-problems-list";
import StructuredData from "@/components/seo/structured-data";

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

  return (
    <>
      <StructuredData data={itemListSchema} />
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
