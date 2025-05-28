
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Loading page...</p>
    </div>
  );
}
