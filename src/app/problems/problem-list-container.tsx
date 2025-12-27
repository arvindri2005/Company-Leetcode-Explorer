import { problemService } from "@/services/problem.service";
import AllProblemsList from "@/components/problem/all-problems-list";

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

  return (
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
  );
}
