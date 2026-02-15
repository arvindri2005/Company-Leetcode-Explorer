/**
 * @fileoverview A client-side component for generating, viewing, and saving an AI-powered interview strategy.
 *
 * This component provides a user interface for creating a personalized interview
 * preparation plan for a specific company. It allows users to select a target
 * role level, generate a strategy using an AI service, view the results, and
 * save the strategy to their profile for later access.
 */
"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brain, Info, LogIn } from "lucide-react";

import { targetRoleLevelOptions } from "@/features/ai";
import { useAICooldown } from "@/features/ai";
import { useAuth } from "@/providers";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import type { TargetRoleLevel } from "@/shared/types";

import { useStrategyGeneration } from "../../hooks/use-strategy-generation";
import { useStrategyPersistence } from "../../hooks/use-strategy-persistence";

import { LoadingState } from "./loading-state";
import { StrategyActions } from "./strategy-actions";
import { StrategyDisplay } from "./strategy-display";
import { StrategyForm } from "./strategy-form";

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
  const [selectedRoleLevel, setSelectedRoleLevel] =
    useState<TargetRoleLevel>("general");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { canUseAI, startCooldown, getFormattedRemainingTime, isLoadingCooldown } =
    useAICooldown();
  const pathname = usePathname();

  // Use extracted hooks
  const { strategy, isGenerating, generateStrategy, setStrategy } =
    useStrategyGeneration();
  const {
    isSaving,
    isLoading: isLoadingSaved,
    hasSavedStrategy,
    saveStrategy,
    loadStrategy,
    setHasSavedStrategy,
  } = useStrategyPersistence();

  // Load saved strategy on mount
  useEffect(() => {
    if (user && !authLoading) {
      const timer = setTimeout(async () => {
        const loadedStrategy = await loadStrategy(user.id, companyId);
        if (loadedStrategy) {
          setStrategy(loadedStrategy);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, companyId, loadStrategy, setStrategy]);

  const handleGenerateStrategy = async () => {
    if (!user) {
      return;
    }
    if (isLoadingCooldown || !canUseAI) {
      toast({
        title: "AI Feature on Cooldown",
        description: `Please wait ${getFormattedRemainingTime()} before using another AI feature.`,
        variant: "default",
      });
      return;
    }

    if (!hasSavedStrategy) {
      // Only clear non-saved strategy
      setStrategy(null);
    }

    toast({
      title: "AI Strategy Generation In Progress 🧠💡",
      description: `Asking AI to develop a preparation strategy for ${companyName}${selectedRoleLevel !== "general" ? ` (targeting ${targetRoleLevelOptions.find((o) => o.value === selectedRoleLevel)?.label} role)` : ""}...`,
    });

    const result = await generateStrategy(
      companyId,
      companyName,
      selectedRoleLevel
    );

    if (!result) {
      toast({
        title: "AI Strategy Generation Failed",
        description: "Could not generate a strategy at this time.",
        variant: "destructive",
      });
    } else {
      setHasSavedStrategy(false); // A newly generated strategy is not yet saved
      startCooldown(); // Start cooldown on successful AI operation
      toast({
        title: "AI Preparation Strategy Generated! 🚀",
        description: `Successfully created a strategy for ${companyName}.`,
      });
    }
  };

  const handleSaveStrategy = async () => {
    if (!user || !strategy) {
      toast({
        title: "Cannot Save",
        description: "No user logged in or no strategy data to save.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Saving Strategy...", description: "Please wait." });

    const success = await saveStrategy(user.id, companyId, companyName, strategy);

    if (success) {
      toast({
        title: "Strategy Saved!",
        description: `Your strategy for ${companyName} has been saved to your profile.`,
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Could not save the strategy.",
        variant: "destructive",
      });
    }
  };

  const isGenerateButtonDisabled =
    authLoading ||
    isLoadingCooldown ||
    (!isLoadingCooldown && !canUseAI && !hasSavedStrategy) ||
    isGenerating ||
    isLoadingSaved;

  const renderMainContent = () => {
    if (authLoading || (isLoadingSaved && !strategy)) {
      return <LoadingState message="Loading AI Strategy Feature..." />;
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

    const roleLevelLabel =
      targetRoleLevelOptions.find((opt) => opt.value === selectedRoleLevel)
        ?.label || "General";

    return (
      <>
        <StrategyForm
          selectedRoleLevel={selectedRoleLevel}
          onRoleLevelChange={setSelectedRoleLevel}
          onGenerate={handleGenerateStrategy}
          disabled={isGenerateButtonDisabled}
          isGenerating={isGenerating}
          hasSavedStrategy={hasSavedStrategy}
          canUseAI={canUseAI}
          isLoadingCooldown={isLoadingCooldown}
          formattedRemainingTime={getFormattedRemainingTime()}
          isLoggedIn={!!user}
        />

        {isLoadingSaved && !strategy && !isGenerating && (
          <LoadingState message="Loading saved strategy..." />
        )}

        {!isLoadingSaved && strategy && (
          <StrategyDisplay
            strategyData={strategy}
            companyName={companyName}
            hasSavedStrategy={hasSavedStrategy}
            roleLevelLabel={roleLevelLabel}
            actionButtons={
              user &&
              strategy.todoItems &&
              strategy.todoItems.length > 0 && (
                <StrategyActions
                  onSave={handleSaveStrategy}
                  isSaving={isSaving}
                  disabled={isSaving || isGenerating || isLoadingSaved}
                  hasSavedStrategy={hasSavedStrategy}
                />
              )
            }
          />
        )}

        {!isLoadingSaved && !strategy && !isGenerating && user && (
          <p className="text-center text-muted-foreground py-6">
            Click &quot;
            {hasSavedStrategy ? "Regenerate Strategy" : "Generate Prep Strategy"}
            &quot; to get an AI-powered plan for {companyName}.
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
