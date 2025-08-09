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

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    searchTerm?: string;
}

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
                    </PaginationItem>
                );
            }
        } else {
            // Always show first page
            pages.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        href={createPageUrl(1)}
                        isActive={1 === currentPage}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
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
                pages.push(<PaginationItem key="start-ellipsis">{ellipsis}</PaginationItem>);
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
                    </PaginationItem>
                );
            }

            if (endPage < totalPages - 1) {
                pages.push(<PaginationItem key="end-ellipsis">{ellipsis}</PaginationItem>);
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
                </PaginationItem>
            );
        }

        return pages;
    };

    return (
        <nav
            aria-label="Pagination"
            className="mt-8 flex justify-center"
        >
            <PaginationContainer>
                <PaginationContent>
                    {currentPage > 1 && (
                        <PaginationItem>
                            <PaginationPrevious
                                href={createPageUrl(currentPage - 1)}
                            />
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
