import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ChevronLeft, PlusSquare } from 'lucide-react';
import Link from 'next/link';

interface NoProblemsAvailableProps {
  companyName: string;
  companyId: string;
}

export default function NoProblemsAvailable({ companyName, companyId }: NoProblemsAvailableProps) {
  return (
    <Card className="text-center py-8 rounded-xl">
      <CardContent>
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-2">No Problems Available for {companyName}</h2>
        <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
          We don't have coding problems for {companyName} yet. You can help by adding some!
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/companies">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Browse Companies
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1">
            <Link href={`/submit-problem?companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`}>
              <PlusSquare className="h-4 w-4 mr-1" />
              Add Problem
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
