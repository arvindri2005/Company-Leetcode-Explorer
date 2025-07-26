import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ProblemLoadErrorProps {
  companyName: string;
  error: string;
}

export default function ProblemLoadError({ companyName, error }: ProblemLoadErrorProps) {
  return (
    <Card className="my-4 border-destructive bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center text-lg">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Failed to Load Problems
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-destructive/90 text-sm">
          We encountered an issue trying to load the problems for {companyName}.
          This might be a temporary issue with our services or with accessing the data.
        </p>
        <p className="text-xs text-destructive/70 mt-2">Error details: {error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
          Try Refreshing
        </Button>
      </CardContent>
    </Card>
  );
}
