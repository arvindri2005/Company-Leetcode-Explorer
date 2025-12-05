"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  className,
}: PaginationControlsProps) {
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

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Link
        href={currentPage > 1 ? `${baseUrl}/${currentPage - 1}` : "#"}
        aria-disabled={currentPage <= 1}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white",
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
            className="flex h-9 w-9 items-center justify-center text-gray-500"
          >
            <MoreHorizontal className="h-4 w-4" />
          </div>
        ) : (
          <Link
            key={page}
            href={`${baseUrl}/${page}`}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
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
        href={currentPage < totalPages ? `${baseUrl}/${currentPage + 1}` : "#"}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white",
          currentPage >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Link>
    </div>
  );
}
