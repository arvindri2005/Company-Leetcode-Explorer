
'use client';

import React from 'react';
import type { SavedStrategyTodoList, StrategyTodoItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, ListChecks, Target, FolderKanban, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface StrategyListsSectionProps {
  strategyTodoLists: SavedStrategyTodoList[];
  isLoadingStrategyTodoLists: boolean;
  updatingTodoItemId: string | null;
  handleToggleTodoItem: (companyId: string, itemIndex: number, newStatus: boolean) => Promise<void>;
}

const StrategyListsSection: React.FC<StrategyListsSectionProps> = ({
  strategyTodoLists,
  isLoadingStrategyTodoLists,
  updatingTodoItemId,
  handleToggleTodoItem,
}) => {
  if (isLoadingStrategyTodoLists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" />Saved Strategy To-Do Lists</CardTitle>
          <CardDescription>Loading your saved AI-generated To-Do lists...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (strategyTodoLists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" />Saved Strategy To-Do Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            You haven't saved any AI-generated company strategies yet.
            Generate one from a company's page to see it here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" />Saved Strategy To-Do Lists</CardTitle>
        <CardDescription>Your AI-generated To-Do lists for company-specific interview preparation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-3">
          {strategyTodoLists.map((list) => (
            <AccordionItem value={list.companyId} key={list.companyId} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                Strategy for {list.companyName}
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 space-y-4">
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center"><ListChecks size={18} className="mr-2 text-primary" />Overall Strategy</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none p-3 bg-muted/50 rounded-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{list.preparationStrategy}</ReactMarkdown>
                  </div>
                </div>
                {list.focusTopics.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2 flex items-center"><Target size={18} className="mr-2 text-primary" />Key Focus Topics</h4>
                    <ul className="list-disc space-y-1 pl-5">
                      {list.focusTopics.map((topic, idx) => (
                        <li key={idx} className="prose prose-sm dark:prose-invert max-w-none">
                          <strong>{topic.topic}:</strong> {topic.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {list.items.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2 flex items-center"><FolderKanban size={18} className="mr-2 text-primary" />To-Do Items</h4>
                    <ul className="space-y-2">
                      {list.items.map((item, index) => {
                        const itemId = `${list.companyId}-${index}`;
                        return (
                          <li key={itemId} className="flex items-center space-x-2 p-2 border-b last:border-b-0">
                            <Checkbox
                              id={itemId}
                              checked={item.isCompleted}
                              onCheckedChange={(checked) => handleToggleTodoItem(list.companyId, index, !!checked)}
                              disabled={updatingTodoItemId === itemId}
                              aria-label={`Mark to-do item as ${item.isCompleted ? 'incomplete' : 'complete'}`}
                            />
                            <label
                              htmlFor={itemId}
                              className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow prose prose-sm dark:prose-invert max-w-full",
                                item.isCompleted && "line-through text-muted-foreground"
                              )}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                                {item.text}
                              </ReactMarkdown>
                            </label>
                            {updatingTodoItemId === itemId && <Loader2 className="h-4 w-4 animate-spin" />}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                 <p className="text-xs text-muted-foreground mt-3">
                    Saved on: {new Date(list.savedAt).toLocaleDateString()}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default StrategyListsSection;
