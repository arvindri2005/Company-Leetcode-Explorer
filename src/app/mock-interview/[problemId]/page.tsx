
import { getProblemById } from '@/lib/data';
import type { LeetCodeProblem } from '@/types';
import MockInterviewChat from '@/components/ai/mock-interview-chat';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react'; // Corrected import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DifficultyBadge from '@/components/problem/difficulty-badge';
import TagBadge from '@/components/problem/tag-badge';

interface MockInterviewPageProps {
  params: { problemId: string };
}

export async function generateMetadata({ params }: MockInterviewPageProps) {
  const problem = await getProblemById(params.problemId);
  if (!problem) {
    return { title: 'Problem Not Found' };
  }
  return { title: `Mock Interview: ${problem.title}` };
}

export default async function MockInterviewPage({ params }: MockInterviewPageProps) {
  const problem = await getProblemById(params.problemId);

  if (!problem) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
        <p className="text-muted-foreground mb-6">The problem you are looking for does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/">Go Back to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-6 flex flex-col h-full"> {/* Changed from h-[calc(100vh-120px)] to h-full */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Mock Interview: {problem.title}
        </h1>
        <p className="text-muted-foreground">Practice solving this problem with an AI interviewer.</p>
      </div>
      
      <Card className="mb-4 flex-shrink-0 shadow-md">
        <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-xl">{problem.title}</CardTitle>
                <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <CardDescription>
                <Link href={problem.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View on LeetCode <ExternalLink size={14} />
                </Link>
            </CardDescription>
        </CardHeader>
        {problem.tags.length > 0 && (
            <CardContent className="pt-0">
                 <div className="text-xs text-muted-foreground mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
            </CardContent>
        )}
      </Card>

      <Separator className="my-2 flex-shrink-0"/>
      
      <div className="flex-grow overflow-hidden min-h-0"> {/* Added min-h-0 for better flex behavior */}
        <MockInterviewChat problem={problem} />
      </div>
    </section>
  );
}

