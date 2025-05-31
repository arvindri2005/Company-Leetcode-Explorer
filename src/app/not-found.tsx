
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
      <AlertTriangle className="h-20 w-20 text-primary mb-6" />
      <h1 className="text-4xl font-bold mb-3">Oops! Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/companies">
            Browse Companies
          </Link>
        </Button>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Error Code: 404
      </p>
    </div>
  );
}
