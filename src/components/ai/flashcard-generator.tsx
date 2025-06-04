
'use client';

import type { Flashcard } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateFlashcardsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2, LogIn, Info, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/auth-context';
import { useAICooldown } from '@/hooks/use-ai-cooldown'; // Import cooldown hook
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FlashcardGeneratorProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ companyId, companyName, companySlug }) => {
  const { user, loading: authLoading } = useAuth();
  const { canUseAI, startCooldown, formattedRemainingTime, isLoadingCooldown } = useAICooldown(); // Cooldown hook
  const pathname = usePathname();
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isAILoading, setIsAILoading] = useState(false); // Renamed isLoading
  const { toast } = useToast();

  const handleGenerateFlashcards = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please log in to generate flashcards.', variant: 'destructive' });
      return;
    }
    if (isLoadingCooldown || !canUseAI) {
      toast({ title: "AI Feature on Cooldown", description: `Please wait ${formattedRemainingTime} before using another AI feature.`, variant: "default" });
      return;
    }

    setIsAILoading(true);
    setFlashcards(null);
    toast({
      title: 'AI Flashcard Generation In Progress 🧠',
      description: `Asking AI to create flashcards for ${companyName}...`,
    });

    const result = await generateFlashcardsAction(companyId);
    setIsAILoading(false);

    if ('error' in result || !result.flashcards) {
      toast({
        title: 'AI Flashcard Generation Failed',
        description: ('error' in result && result.error) || 'Could not generate flashcards.',
        variant: 'destructive',
      });
    } else if (result.flashcards.length === 0) {
      toast({
        title: 'No Flashcards Generated',
        description: `AI could not generate flashcards for ${companyName} based on the available problems.`,
        variant: 'default',
      });
       setFlashcards([]);
       // Still start cooldown as an AI attempt was made.
       startCooldown(); 
    } else {
      setFlashcards(result.flashcards);
      startCooldown(); // Start cooldown on successful AI operation
      toast({
        title: 'AI Flashcards Generated! 🎉',
        description: `Created ${result.flashcards.length} flashcards for ${companyName}.`,
      });
    }
  };
  
  const isButtonDisabled = authLoading || isLoadingCooldown || (!isLoadingCooldown && !canUseAI) || isAILoading;

  const renderContent = () => {
    if (authLoading) {
      return (
        <div className="flex justify-center my-8">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading AI Feature...
        </div>
      );
    }

    if (!user) {
      return (
        <Card className="mt-6 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Info size={22}/> Login to Generate Flashcards</CardTitle>
            <CardDescription>This AI-powered feature requires you to be logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/login?redirectUrl=${encodeURIComponent(pathname)}`}>
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center mb-8">
          <Button onClick={handleGenerateFlashcards} disabled={isButtonDisabled} size="lg">
            {isAILoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-5 w-5" />
                Generate Flashcards with AI
              </>
            )}
          </Button>
           {(!isLoadingCooldown && !canUseAI && user) && (
             <p className="mt-2 text-xs text-destructive flex items-center">
                <AlertCircle size={14} className="mr-1" />
                AI on cooldown. Available in: {formattedRemainingTime}
             </p>
          )}
        </div>

        {flashcards && flashcards.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Generated Flashcards for {companyName}</CardTitle>
              <CardDescription>Click on a question to reveal the answer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="item-0">
                {flashcards.map((flashcard, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border bg-card rounded-md shadow-sm hover:shadow-md transition-shadow">
                    <AccordionTrigger
                      className="p-4 text-left text-md font-medium hover:no-underline"
                    >
                      <div className="flex-1 prose prose-sm dark:prose-invert max-w-full break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                              {flashcard.front}
                          </ReactMarkdown>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                      <div className="prose prose-sm dark:prose-invert max-w-full break-words bg-muted/30 p-3 rounded-md">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {flashcard.back}
                          </ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
        {flashcards && flashcards.length === 0 && !isAILoading && (
          <p className="text-center text-muted-foreground">
            No flashcards were generated. This might happen if there are no problems associated with {companyName} or the AI couldn't find suitable concepts.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="mt-12 py-8">
      <Separator className="my-8" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <BrainCircuit className="inline-block mr-2 h-7 w-7 text-primary" />
          AI-Powered Study Flashcards
        </h2>
        <p className="mt-2 text-muted-foreground">
          Generate flashcards for key concepts and problems related to {companyName}.
          {!user && !authLoading && ` Log in to use this feature.`}
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default FlashcardGenerator;
