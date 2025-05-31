
'use client';

import type { Flashcard } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateFlashcardsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FlashcardGeneratorProps {
  companyId: string;
  companyName: string;
  companySlug: string; // Added to use in toast message if needed, or for future context
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ companyId, companyName, companySlug }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleGenerateFlashcards = async () => {
    setIsLoading(true);
    setFlashcards(null);
    setActiveCardIndex(null);
    toast({
      title: 'AI Flashcard Generation In Progress 🧠',
      description: `Asking AI to create flashcards for ${companyName}...`,
    });

    const result = await generateFlashcardsAction(companyId);
    setIsLoading(false);

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
    } else {
      setFlashcards(result.flashcards);
      toast({
        title: 'AI Flashcards Generated! 🎉',
        description: `Created ${result.flashcards.length} flashcards for ${companyName}.`,
      });
    }
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
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <Button onClick={handleGenerateFlashcards} disabled={isLoading} size="lg">
          {isLoading ? (
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
      </div>

      {flashcards && flashcards.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Generated Flashcards for {companyName}</CardTitle>
            <CardDescription>Click on a question to reveal the answer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {flashcards.map((flashcard, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border bg-card rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger 
                    className="p-4 text-left text-md font-medium hover:no-underline"
                    onClick={() => setActiveCardIndex(activeCardIndex === index ? null : index)}
                  >
                    <div className="flex-1 prose prose-sm dark:prose-invert max-w-full break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                            {flashcard.front}
                        </ReactMarkdown>
                    </div>
                    {/* Icon is part of AccordionTrigger by default */}
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
      {flashcards && flashcards.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground">
          No flashcards were generated. This might happen if there are no problems associated with {companyName} or the AI couldn't find suitable concepts.
        </p>
      )}
    </div>
  );
};

export default FlashcardGenerator;
