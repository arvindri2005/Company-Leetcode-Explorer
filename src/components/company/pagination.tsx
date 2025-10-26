/**
 * @fileoverview A component for rendering pagination controls.
 *
 * This component generates a set of pagination links, including previous/next
 * buttons and page numbers. It intelligently handles the display of page links,
 * using ellipses for larger page ranges to keep the control compact. It is
 * designed to work with Next.js's `Link` component for client-side navigation.
 */
import Link from "next/link";
import {
  Pagination as PaginationContainer,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Props for the Pagination component.
 */
interface PaginationProps {
  /** The current active page number. */
  currentPage: number;
  /** The total number of pages available. */
  totalPages: number;
  /** An optional search term to include in the pagination links. */
  searchTerm?: string;
}

/**
 * Renders a pagination control for navigating between pages of a list.
 *
 * This component builds the necessary page links, including "Previous" and "Next"
 * buttons, and a dynamic list of page numbers. It handles the logic for displaying
 * ellipses when there are many pages, ensuring a clean and user-friendly interface.
 * The component does not render if there is only one page or fewer.
 *
 * @param {PaginationProps} props - The props for configuring the pagination.
 * @returns {JSX.Element | null} The rendered pagination component, or null if not needed.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  searchTerm,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    if (page > 1) {
      params.set("page", page.toString());
    }
    return `/companies?${params.toString()}`;
  };

  const renderPaginationLinks = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const ellipsis = <PaginationEllipsis />;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageUrl(i)}
              isActive={i === currentPage}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      // Always show first page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink href={createPageUrl(1)} isActive={1 === currentPage}>
            1
          </PaginationLink>
        </PaginationItem>,
      );

      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage - 1 <= 2) {
        endPage = 1 + maxPagesToShow - 1;
      }

      if (totalPages - currentPage <= 2) {
        startPage = totalPages - maxPagesToShow + 1;
      }

      if (startPage > 2) {
        pages.push(
          <PaginationItem key="start-ellipsis">{ellipsis}</PaginationItem>,
        );
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageUrl(i)}
              isActive={i === currentPage}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }

      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="end-ellipsis">{ellipsis}</PaginationItem>,
        );
      }

      // Always show last page
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href={createPageUrl(totalPages)}
            isActive={totalPages === currentPage}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return pages;
  };

  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-center">
      <PaginationContainer>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={createPageUrl(currentPage - 1)} />
            </PaginationItem>
          )}
          {renderPaginationLinks()}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext href={createPageUrl(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </PaginationContainer>
    </nav>
  );
};

export default Pagination;
