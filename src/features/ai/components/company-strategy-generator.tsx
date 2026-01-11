/**
 * @fileoverview A client-side component for generating, viewing, and saving an AI-powered interview strategy.
 *
 * This component provides a user interface for creating a personalized interview
 * preparation plan for a specific company. It allows users to select a target
 * role level, generate a strategy using an AI service, view the results, and
 * save the strategy to their profile for later access.
 */
"use client";

import { useCallback,useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AlertCircle,
  Brain,
  CheckSquare,
  Info,
  Lightbulb,
  ListChecks,
  Loader2,
  LogIn,
  RefreshCw,
  Save,
  Target,
  UserCheck,
} from "lucide-react";
import remarkGfm from "remark-gfm";

import { generateCompanyStrategyAction } from "@/app/actions/ai.actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { targetRoleLevelOptions } from "@/features/ai";
import { useAICooldown } from "@/features/ai";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers";
import type {
  GenerateCompanyStrategyOutput,
  TargetRoleLevel,
} from "@/types";

/**
 * Props for the CompanyStrategyGenerator component.
 */
interface CompanyStrategyGeneratorProps {
  /** The unique ID of the company. */
  companyId: string;
  /** The name of the company. */
  companyName: string;
  /** The URL slug for the company. */
  companySlug: string;
}

/**
 * Renders an interactive section for generating and managing an AI-powered company-specific interview strategy.
 *
 * This component handles the full lifecycle of the strategy feature:
 * - On mount, it checks if a user is logged in and tries to load a previously saved strategy for the company.
 * - Provides controls to select a target role and trigger AI strategy generation.
 * - Manages AI cooldowns to prevent feature abuse.
 * - Displays loading states while fetching or generating data.
 * - Renders the generated strategy, including a markdown plan, key focus topics, and an actionable to-do list.
 * - Allows the user to save a newly generated strategy or update an existing one.
 *
 * @param {CompanyStrategyGeneratorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered strategy generator component.
 */
const CompanyStrategyGenerator: React.FC<CompanyStrategyGeneratorProps> = ({
  companyId,
  companyName,
}) => {
  const [strategyData, setStrategyData] =
    useState<GenerateCompanyStrategyOutput | null>(null);
  const [isAILoading, setIsAILoading] = useState(false); // Renamed isLoading
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [hasSavedStrategy, setHasSavedStrategy] = useState(false);
  const [selectedRoleLevel, setSelectedRoleLevel] =
    useState<TargetRoleLevel>("general");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { canUseAI, startCooldown, getFormattedRemainingTime, isLoadingCooldown } =
    useAICooldown(); // Cooldown hook
  const pathname = usePathname();

  const loadSavedStrategy = useCallback(async () => {
    if (!user) {return;}
    setIsLoadingSaved(true);
    setStrategyData(null);
    setHasSavedStrategy(false);

    try {
      const result = await userService.getStrategyTodoListForCompany(
        user.uid,
        companyId,
      );
      setIsLoadingSaved(false);

      if (result.isSuccess && result.value) {
        const loadedStrategy: GenerateCompanyStrategyOutput = {
          preparationStrategy: result.value.preparationStrategy,
          focusTopics: result.value.focusTopics,
          todoItems: result.value.items,
        };
        setStrategyData(loadedStrategy);
        setHasSavedStrategy(true);
      }
    } catch (error) {
      setIsLoadingSaved(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
       if (errorMessage !== "Todo list not found.") {
        toast({
          title: "Error Loading Saved Strategy",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [user, companyId, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      const timer = setTimeout(() => {
        loadSavedStrategy();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, loadSavedStrategy]);

  const handleGenerateStrategy = async () => {
    if (!user) {return;}
    if (isLoadingCooldown || !canUseAI) {
      toast({
        title: "AI Feature on Cooldown",
        description: `Please wait ${getFormattedRemainingTime()} before using another AI feature.`,
        variant: "default",
      });
      return;
    }

    setIsAILoading(true);
    if (!hasSavedStrategy) {
      // Only clear non-saved strategy
      setStrategyData(null);
    }

    toast({
      title: "AI Strategy Generation In Progress 🧠💡",
      description: `Asking AI to develop a preparation strategy for ${companyName}${selectedRoleLevel !== "general" ? ` (targeting ${targetRoleLevelOptions.find((o) => o.value === selectedRoleLevel)?.label} role)` : ""}...`,
    });

    const result = await generateCompanyStrategyAction(
      companyId,
      selectedRoleLevel === "general" ? undefined : selectedRoleLevel,
    );
    setIsAILoading(false);

    if (
      !result.success ||
      !result.data ||
      !result.data.preparationStrategy ||
      !result.data.focusTopics ||
      !result.data.todoItems
    ) {
      toast({
        title: "AI Strategy Generation Failed",
        description:
          result.error?.message ||
          "Could not generate a strategy at this time.",
        variant: "destructive",
      });
    } else {
      setStrategyData(result.data);
      setHasSavedStrategy(false); // A newly generated strategy is not yet saved
      startCooldown(); // Start cooldown on successful AI operation
      toast({
        title: "AI Preparation Strategy Generated! 🚀",
        description: `Successfully created a strategy for ${companyName}.`,
      });
    }
  };

  const handleSaveStrategy = async () => {
    if (!user || !strategyData) {
      toast({
        title: "Cannot Save",
        description: "No user logged in or no strategy data to save.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    toast({ title: "Saving Strategy...", description: "Please wait." });

    const result = await userService.saveStrategyTodoList(
      user.uid,
      companyId,
      companyName,
      {
        preparationStrategy: strategyData.preparationStrategy,
        focusTopics: strategyData.focusTopics,
        todoItems: strategyData.todoItems,
      },
    );
    setIsSaving(false);

    if (result.isSuccess) {
      setHasSavedStrategy(true);
      toast({
        title: "Strategy Saved!",
        description: `Your strategy for ${companyName} has been saved to your profile.`,
      });
    } else {
      toast({
        title: "Save Failed",
        description: result.error?.message || "Could not save the strategy.",
        variant: "destructive",
      });
    }
  };

  const generateButtonText = hasSavedStrategy
    ? "Regenerate Strategy"
    : "Generate Prep Strategy";
  const generateButtonIcon = hasSavedStrategy ? (
    <RefreshCw className="mr-2 h-5 w-5" />
  ) : (
    <Lightbulb className="mr-2 h-5 w-5" />
  );
  const isGenerateButtonDisabled =
    authLoading ||
    isLoadingCooldown ||
    (!isLoadingCooldown && !canUseAI && !hasSavedStrategy) ||
    isAILoading ||
    isLoadingSaved;

  const renderMainContent = () => {
    if (authLoading || (isLoadingSaved && !strategyData)) {
      // Show loading if auth is pending or initial saved strategy load for a potential user
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">
            Loading AI Strategy Feature...
          </p>
        </div>
      );
    }

    if (!user) {
      return (
        <Card className="mt-6 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Info size={22} /> Login to Generate Strategy
            </CardTitle>
            <CardDescription>
              This AI-powered feature requires you to be logged in.
            </CardDescription>
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
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto sm:max-w-xs">
              <Label
                htmlFor="role-level-select"
                className="mb-1.5 flex items-center text-sm font-medium text-muted-foreground justify-center sm:justify-start"
              >
                <UserCheck size={16} className="mr-2" /> Target Role Level
              </Label>
              <Select
                value={selectedRoleLevel}
                onValueChange={(value) =>
                  setSelectedRoleLevel(value as TargetRoleLevel)
                }
                disabled={isAILoading || isLoadingSaved}
              >
                <SelectTrigger id="role-level-select" className="w-full">
                  <SelectValue placeholder="Select role level" />
                </SelectTrigger>
                <SelectContent>
                  {targetRoleLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerateStrategy}
              disabled={isGenerateButtonDisabled}
              size="lg"
              className="w-full mt-2 sm:mt-0 sm:w-auto self-center sm:self-end"
            >
              {isAILoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {generateButtonIcon}
                  {generateButtonText}
                </>
              )}
            </Button>
          </div>
          {!isLoadingCooldown &&
            !canUseAI &&
            user &&
            (!hasSavedStrategy || isAILoading) && ( // Show cooldown if trying to generate new and cooldown active
              <p className="text-xs text-destructive flex items-center">
                <AlertCircle size={14} className="mr-1" />
                AI on cooldown. Available in: {getFormattedRemainingTime()}
              </p>
            )}
        </div>

        {isLoadingSaved && !strategyData && !isAILoading && (
          <div className="flex flex-col items-center justify-center p-10">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">
              Loading saved strategy...
            </p>
          </div>
        )}

        {!isLoadingSaved && strategyData && (
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
                    Tailored for a{" "}
                    {targetRoleLevelOptions
                      .find((opt) => opt.value === selectedRoleLevel)
                      ?.label.toLowerCase()}{" "}
                    role.
                  </CardDescription>
                </div>
                {user &&
                  strategyData.todoItems &&
                  strategyData.todoItems.length > 0 && (
                    <Button
                      onClick={handleSaveStrategy}
                      disabled={isSaving || isAILoading || isLoadingSaved}
                      size="sm"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {hasSavedStrategy
                        ? "Update Saved Strategy"
                        : "Save Strategy"}
                    </Button>
                  )}
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

              {strategyData.focusTopics &&
                strategyData.focusTopics.length > 0 && (
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
                        strategyData.focusTopics.length > 0
                          ? "topic-0"
                          : undefined
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
                          item.isCompleted &&
                            "line-through text-muted-foreground",
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
        )}
        {!isLoadingSaved && !strategyData && !isAILoading && user && (
          <p className="text-center text-muted-foreground py-6">
            Click &quot;{generateButtonText}&quot; to get an AI-powered plan for{" "}
            {companyName}.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <Separator className="my-8" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <Brain className="inline-block mr-2 h-7 w-7 text-primary" />
          AI-Powered Interview Strategy
        </h2>
        <p className="mt-2 text-muted-foreground">
          {user && hasSavedStrategy
            ? `Your saved preparation plan for ${companyName} is shown below. You can regenerate it or save changes.`
            : `Get a personalized preparation plan for ${companyName} based on its known problems.`}
          {!user &&
            !authLoading &&
            ` Log in to generate and save your personalized strategy.`}
        </p>
      </div>
      {renderMainContent()}
    </div>
  );
};

export default CompanyStrategyGenerator;






