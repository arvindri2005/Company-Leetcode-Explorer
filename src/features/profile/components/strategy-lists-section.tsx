"use client";

import React, { memo, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import Link from "next/link";

import { Brain, FolderKanban, ListChecks, Loader2, Target } from "lucide-react";
import remarkGfm from "remark-gfm";

import { StrategyListSkeleton } from "@/shared/components/skeletons/strategy-skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { SavedStrategyTodoList, StrategyTodoItem as StrategyTodoItemType } from "@/shared/types";

/**
 * @interface StrategyListsSectionProps
 * @description Props for the StrategyListsSection component.
 */
interface StrategyListsSectionProps {
  strategyTodoLists: SavedStrategyTodoList[];
  isLoadingStrategyTodoLists: boolean;
  updatingTodoItemId: string | null;
  handleToggleTodoItem: (
    companyId: string,
    itemIndex: number,
    newStatus: boolean,
  ) => Promise<void>;
}

// --- Components for optimization ---

/**
 * @component StrategyMarkdown
 * @description Memoized component for rendering Markdown content.
 * Prevents expensive re-parsing when the parent re-renders but content is unchanged.
 */
const StrategyMarkdown = memo(({ content, className, components }: { content: string, className?: string, components?: Record<string, React.ElementType | string> }) => {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
StrategyMarkdown.displayName = "StrategyMarkdown";

/**
 * @component StrategyTodoItem
 * @description Memoized component for a single todo item to prevent unnecessary re-renders of siblings.
 * Uses a custom comparison function to ignore reference changes when data is identical.
 */
const StrategyTodoItem = memo(
  ({
    item,
    companyId,
    index,
    isUpdating,
    onToggle,
  }: {
    item: StrategyTodoItemType;
    companyId: string;
    index: number;
    isUpdating: boolean;
    onToggle: (companyId: string, itemIndex: number, newStatus: boolean) => void;
  }) => {
    const itemId = `${companyId}-${index}`;
    
    // Create a stable handler call
    const handleCheckedChange = (checked: boolean) => {
      onToggle(companyId, index, !!checked);
    };

    return (
      <li className="flex items-center space-x-2 p-2 border-b last:border-b-0">
        <Checkbox
          id={itemId}
          checked={item.isCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isUpdating}
          aria-label={`Mark to-do item as ${item.isCompleted ? "incomplete" : "complete"}`}
        />
        <label
          htmlFor={itemId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow prose prose-sm dark:prose-invert max-w-full",
            item.isCompleted && "line-through text-muted-foreground",
          )}
        >
          <StrategyMarkdown 
             content={item.text} 
             components={{ p: "span" }} 
             className="contents" // "contents" display to maintain inline behavior
          />
        </label>
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      </li>
    );
  },
  (prev, next) => {
    // Custom comparison to prevent re-renders when parent list is refreshed (new object references)
    // but the item data for this specific item is identical.
    return (
      prev.companyId === next.companyId &&
      prev.index === next.index &&
      prev.isUpdating === next.isUpdating &&
      prev.onToggle === next.onToggle &&
      prev.item.isCompleted === next.item.isCompleted &&
      prev.item.text === next.item.text
    );
  }
);
StrategyTodoItem.displayName = "StrategyTodoItem";

/**
 * @component StrategyListItem
 * @description Memoized component for a company's strategy list.
 * This ensures that when one company's list updates, others do not re-render.
 */
const StrategyListItem = memo(
  ({
    list,
    updatingTodoItemId,
    onToggle,
  }: {
    list: SavedStrategyTodoList;
    updatingTodoItemId: string | null;
    onToggle: (companyId: string, itemIndex: number, newStatus: boolean) => void;
  }) => {
    return (
      <AccordionItem
        value={list.companyId}
        className="bg-card border border-border rounded-xl shadow-smborder shadow-sm"
      >
        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
          Strategy for {list.companyName}
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0 space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-2 flex items-center">
              <ListChecks size={18} className="mr-2 text-primary" />
              Overall Strategy
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none p-3 bg-muted/50 rounded-md">
              <StrategyMarkdown content={list.preparationStrategy} />
            </div>
          </div>
          {list.focusTopics.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <Target size={18} className="mr-2 text-primary" />
                Key Focus Topics
              </h4>
              <ul className="list-disc space-y-1 pl-5">
                {list.focusTopics.map((topic, idx) => (
                  <li
                    key={idx}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  >
                    <strong>{topic.topic}:</strong> {topic.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {list.items.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <FolderKanban size={18} className="mr-2 text-primary" />
                To-Do Items
              </h4>
              <ul className="space-y-2">
                {list.items.map((item, index) => {
                  const itemId = `${list.companyId}-${index}`;
                  return (
                    <StrategyTodoItem
                      key={itemId}
                      item={item}
                      companyId={list.companyId}
                      index={index}
                      isUpdating={updatingTodoItemId === itemId}
                      onToggle={onToggle}
                    />
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
    );
  }
);
StrategyListItem.displayName = "StrategyListItem";

/**
 * @function StrategyListsSection
 * @description A component that displays a user's saved AI-generated strategy to-do lists for various companies.
 */
const StrategyListsSection: React.FC<StrategyListsSectionProps> = ({
  strategyTodoLists,
  isLoadingStrategyTodoLists,
  updatingTodoItemId,
  handleToggleTodoItem,
}) => {
  // Optimization: Stabilize handleToggleTodoItem using the ref pattern.
  // The parent passes a new function reference on every toggle (due to dependency on state).
  // Without this stabilization, `StrategyListItem` and `StrategyTodoItem` would re-render for ALL items/lists
  // whenever ANY item is toggled, defeating the purpose of React.memo used in those components.
  const handleToggleRef = useRef(handleToggleTodoItem);

  useEffect(() => {
    handleToggleRef.current = handleToggleTodoItem;
  }, [handleToggleTodoItem]);

  const stableHandleToggle = useCallback(
    (companyId: string, itemIndex: number, newStatus: boolean) => {
      return handleToggleRef.current(companyId, itemIndex, newStatus);
    },
    [],
  );

  if (isLoadingStrategyTodoLists) {
    return <StrategyListSkeleton />;
  }

  if (strategyTodoLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted rounded-xl bg-muted/5">
        <div className="bg-background p-3 rounded-full mb-4 ring-1 ring-border shadow-sm">
          <Brain
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No strategies saved
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          You haven&apos;t saved any AI-generated company strategies yet.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/companies">Browse Companies</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          Saved Strategy To-Do Lists
        </CardTitle>
        <CardDescription>
          Your AI-generated To-Do lists for company-specific interview
          preparation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-3">
          {strategyTodoLists.map((list) => {
            // Optimization: Only pass the updating ID if it belongs to this company list.
            // This allows memoized StrategyListItem to skip re-rendering for other companies
            // even when updatingTodoItemId changes (from null to string or vice-versa).
            const activeUpdatingId =
              updatingTodoItemId &&
              updatingTodoItemId.startsWith(`${list.companyId}-`)
                ? updatingTodoItemId
                : null;

            return (
              <StrategyListItem
                key={list.companyId}
                list={list}
                updatingTodoItemId={activeUpdatingId}
                onToggle={stableHandleToggle}
              />
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default memo(StrategyListsSection);
