import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface CompanyPageHeaderProps {
  companyName: string;
}

export default function CompanyPageHeader({ companyName }: CompanyPageHeaderProps) {
  return (
    <div className="mb-4">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/companies" className="hover:text-foreground transition-colors">
          Companies
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{companyName}</span>
      </nav>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/companies">
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back to Companies</span>
        </Link>
      </Button>
    </div>
  );
}
