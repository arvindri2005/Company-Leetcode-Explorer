"use client";

import ReactMarkdown from "react-markdown";

import { CheckSquare, Info, ListChecks, Target } from "lucide-react";
import remarkGfm from "remark-gfm";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GenerateCompanyStrategyOutput } from "@/types";

/**
 * Props for the StrategyDisplay component.
 */
interface StrategyDisplayProps {
  /** The strategy data to display. */
  strategyData: GenerateCompanyStrategyOutput;
  /** The name of the company. */
  companyName: string;
  /** Whether this is a saved strategy. */
  hasSavedStrategy: boolean;
  /** The selected role level label. */
  roleLevelLabel: string;
  /** Action buttons to render in the header. */
  actionButtons?: React.ReactNode;
}

/**
 * Renders the strategy display with preparation plan, focus topics, and todo list.
 *
 * @param {StrategyDisplayProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered strategy display component.
 */
export function StrategyDisplay({
  strategyData,
  companyName,
  hasSavedStrategy,
  roleLevelLabel,
  actionButtons,
}: StrategyDisplayProps): React.JSX.Element {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold leading-none tracking-tight">
              {hasSavedStrategy
                ? "Your Saved Strategy for "
                : "AI-Generated Strategy for "}{" "}
              {companyName}
            </h3>
            <CardDescription>
              {hasSavedStrategy &&
                `Last saved: ${strategyData.todoItems[0]?.isCompleted !== undefined && "savedAt" in strategyData ? new Date((strategyData as GenerateCompanyStrategyOutput & { savedAt: string }).savedAt).toLocaleDateString() : "Just now"}. `}
              Tailored for a {roleLevelLabel.toLowerCase()} role.
            </CardDescription>
          </div>
          {actionButtons}
        </div>
        {hasSavedStrategy && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-xs flex items-center gap-2">
            <Info size={14} /> This is your previously saved strategy.
            Regenerate if you want a fresh plan.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-2 flex items-center">
            <ListChecks size={20} className="mr-2 text-primary" />
            Overall Preparation Strategy
          </h4>
          <div className="prose prose-sm sm:prose dark:prose-invert p-4 bg-muted/30 rounded-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {strategyData.preparationStrategy}
            </ReactMarkdown>
          </div>
        </div>

        {strategyData.focusTopics && strategyData.focusTopics.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <Target size={20} className="mr-2 text-primary" />
              Key Focus Topics
            </h4>
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-2"
              defaultValue={
                strategyData.focusTopics.length > 0 ? "topic-0" : undefined
              }
            >
              {strategyData.focusTopics.map((topicItem, index) => (
                <AccordionItem
                  value={`topic-${index}`}
                  key={index}
                  className="border bg-card rounded-md shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="p-4 text-left text-md font-medium hover:no-underline">
                    <div className="flex-1 prose prose-sm dark:prose-invert max-w-full break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ p: "span" }}
                      >
                        {topicItem.topic}
                      </ReactMarkdown>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="prose prose-sm dark:prose-invert max-w-full break-words bg-muted/30 p-3 rounded-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {topicItem.reason}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {strategyData.todoItems && strategyData.todoItems.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold flex items-center">
                <CheckSquare size={20} className="mr-2 text-primary" />
                Actionable Todo List
              </h4>
            </div>
            <ul className="list-disc space-y-2 pl-5 bg-muted/30 p-4 rounded-md">
              {strategyData.todoItems.map((item, index) => (
                <li
                  key={index}
                  className={cn(
                    "prose prose-sm dark:prose-invert max-w-full",
                    item.isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ p: "span" }}
                  >
                    {item.text}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
            {!hasSavedStrategy && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Don&apos;t forget to save this strategy to your profile if you
                find it useful!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
