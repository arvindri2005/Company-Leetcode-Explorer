import { Button } from '@/components/ui/button';
import { Building2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface CompanyNotFoundProps {
  companySlug: string;
}

export default function CompanyNotFound({ companySlug }: CompanyNotFoundProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
      <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
      <h1 className="text-xl font-semibold mb-2">Company Not Found</h1>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        The company you're looking for (slug: {companySlug}) doesn't exist or may have been removed.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/companies">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Companies
        </Link>
      </Button>
    </div>
  );
}
