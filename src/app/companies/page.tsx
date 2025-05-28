import CompanyList from '@/components/company/company-list';
import { getCompanies } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

const ITEMS_PER_PAGE = 9;

interface CompaniesPageProps {
  searchParams?: {
    page?: string; // Page param is no longer directly used by HomePage for pagination controls
    search?: string;
  };
}

export const metadata = {
  title: 'Explore Companies | Company LeetCode Explorer',
  description: 'Find and explore LeetCode problems by company. Search and filter to find the most relevant companies for your interview preparation.',
};

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const initialPage = 1;
  const searchTerm = searchParams?.search || '';

  const {
    companies: initialCompanies,
    totalPages,
    currentPage,
    totalCompanies
  } = await getCompanies({
    page: initialPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm
  });

  const pageSubtitle = searchTerm
    ? `Found ${totalCompanies} compan${totalCompanies === 1 ? 'y' : 'ies'} matching "${searchTerm}".`
    : `Displaying ${initialCompanies.length > 0 ? 'companies' : 'no companies'}${totalCompanies > 0 ? ` out of ${totalCompanies} total.` : '.'} Scroll down to load more.`;

  return (
    <div className="min-h-screen w-full">
      {/* Main container with responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <section className="space-y-6 sm:space-y-8 lg:space-y-10">
          
          {/* Header section - Responsive typography and spacing */}
          <div className="text-center sm:text-left space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              <span className="block sm:inline">Explore Companies</span>
              <span className="block sm:inline text-primary"> & Their Problems</span>
            </h1>
            
            <div className="max-w-4xl mx-auto sm:mx-0">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {pageSubtitle}
              </p>
              
              {/* Additional context for mobile users */}
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground/80 block sm:hidden">
                Tap on any company to view their interview problems
              </p>
            </div>
          </div>

          {/* Responsive separator */}
          <Separator className="my-6 sm:my-8" />

          {/* Company List */}
          <div className="w-full">
            <CompanyList
              initialCompanies={initialCompanies}
              initialSearchTerm={searchTerm}
              initialTotalPages={totalPages}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>

          {/* Footer spacing for mobile scroll comfort */}
          <div className="h-4 sm:h-6 lg:h-8" />
          
        </section>
      </div>
    </div>
  );
}