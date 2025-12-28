"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
  hideOnSinglePage?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  className,
  createPageUrl,
  hideOnSinglePage = true,
  hasNextPage,
  searchParams,
}: PaginationControlsProps & {
  hasNextPage?: boolean;
  createPageUrl?: (page: number) => string;
  searchParams?: { [key: string]: string | string[] | undefined } | URLSearchParams;
}) {
  const getUrl = (page: number) => {
    if (createPageUrl) return createPageUrl(page);
    
    if (searchParams) {
        // Construct new URLSearchParams from the passed object or instance
        const params = new URLSearchParams(searchParams as any); 
        
        // Handle page param (default 'page', could be configurable but fixed for now)
        if (page > 1) {
            params.set("page", page.toString());
        } else {
            params.delete("page");
        }
        
        // baseUrl should be the path without query string ideally, e.g. "/companies"
        return `${baseUrl}?${params.toString()}`;
    }

    return `${baseUrl}/${page}`;
  };

  // Infinite/Unknown Total Pages Mode
  if (totalPages <= 0) {
      if (currentPage === 1 && !hasNextPage && hideOnSinglePage) return null;

      return (
        <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
          <Link
            href={currentPage > 1 ? getUrl(currentPage - 1) : "#"}
            aria-disabled={currentPage <= 1}
            className={cn(
              "flex h-11 px-4 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white md:h-9",
              currentPage <= 1 && "pointer-events-none opacity-50"
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>

          <div className="flex items-center justify-center px-4 font-medium text-sm h-11 md:h-9">
             Page {currentPage}
          </div>

          <Link
            href={hasNextPage ? getUrl(currentPage + 1) : "#"}
            aria-disabled={!hasNextPage}
            className={cn(
              "flex h-11 px-4 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white md:h-9",
              !hasNextPage && "pointer-events-none opacity-50"
            )}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      );
  }

  // Logic to show a window of pages (e.g., 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1 && hideOnSinglePage) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <Link
        href={currentPage > 1 ? getUrl(currentPage - 1) : "#"}
        aria-disabled={currentPage <= 1}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white md:h-9 md:w-9",
          currentPage <= 1 && "pointer-events-none opacity-50"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Link>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <div
            key={`ellipsis-${index}`}
            className="flex h-11 w-11 items-center justify-center text-gray-500 md:h-9 md:w-9"
          >
            <MoreHorizontal className="h-4 w-4" />
          </div>
        ) : (
          <Link
            key={page}
            href={getUrl(page as number)}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium transition-colors md:h-9 md:w-9",
              currentPage === page
                ? "border-teal-500/50 bg-teal-500/10 text-teal-400 font-bold"
                : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {page}
          </Link>
        )
      )}

      <Link
        href={currentPage < totalPages ? getUrl(currentPage + 1) : "#"}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white md:h-9 md:w-9",
          currentPage >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Link>
    </div>
  );
}
