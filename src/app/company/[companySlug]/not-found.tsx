import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export default function CompanyNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Company Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The company you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Button asChild>
          <Link href="/companies">Browse All Companies</Link>
        </Button>
      </div>
    </div>
  );
}
