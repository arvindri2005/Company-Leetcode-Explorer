/**
 * @fileoverview A redesigned client-side component that organizes company details into interactive tabs.
 *
 * This component features a modern, minimalist design with horizontal tabs,
 * and completely restyled content sections for a cohesive user experience.
 *
 * Update: Now uses the `companyTabRegistry` for extensible tab definitions.
 */
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company, LeetCodeProblem, ProblemListFilters } from "@/types";
import { companyTabRegistry } from "@/lib/company-tab-registry";
import "./default-tabs"; // Import side-effects to register core tabs

interface CompanyTabsProps {
  company: Company;
  displayProblemCount: number;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor: string | null | undefined;
  initialFilters: ProblemListFilters;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export default function CompanyTabs(props: CompanyTabsProps) {
  // Retrieve registered tabs dynamically
  const tabs = companyTabRegistry.getTabs();

  // Default to the first tab (usually "problems") or the one with lowest order
  const defaultTabValue = tabs.length > 0 ? tabs[0].id : "problems";

  return (
    <Tabs defaultValue={defaultTabValue} orientation="horizontal" className="w-full">
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide transition-all duration-300 ease-in-out">
        <TabsList className="inline-flex w-auto justify-start h-auto p-1 bg-muted/50 rounded-lg transition-all duration-300 ease-in-out">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out"
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="mt-4 md:mt-6 transition-all duration-300 ease-in-out">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-0 transition-all duration-300 ease-in-out"
          >
            {tab.render(props)}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
