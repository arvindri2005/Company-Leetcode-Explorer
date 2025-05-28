
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  basePath,
}) => {
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${basePath}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  const maxVisiblePages = 5; // Max number of page links to show (e.g., 1 ... 4 5 6 ... 10)

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
  }


  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
        <Link href={createPageURL(currentPage - 1)} scroll={false}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Link>
      </Button>

      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <Button
            key={`page-${page}`}
            asChild
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={createPageURL(page)} scroll={false}>
              {page}
            </Link>
          </Button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm">
            {page}
          </span>
        )
      )}

      <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
        <Link href={createPageURL(currentPage + 1)} scroll={false}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default PaginationControls;
