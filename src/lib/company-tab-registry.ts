import { ReactNode } from "react";
import { Company, LeetCodeProblem, ProblemListFilters } from "@/types";

/**
 * Context passed to the render function of a CompanyTab.
 * Includes all props necessary for rendering company-specific content.
 */
export interface CompanyTabContext {
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

/**
 * Definition of a tab on the Company Page.
 */
export interface CompanyTab {
  /** Unique identifier for the tab */
  id: string;
  /** Label text to display in the tab trigger */
  label: string;
  /** Icon component (optional) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Order priority (lower numbers appear first) */
  order?: number;
  /** Function to render the tab content */
  render: (context: CompanyTabContext) => ReactNode;
}

/**
 * Registry for managing tabs on the Company Page.
 * Allows decoupling of tab definitions from the main component, enabling extensibility.
 */
class CompanyTabRegistry {
  private tabs: Map<string, CompanyTab> = new Map();

  /**
   * Registers a new tab or updates an existing one.
   * @param tab The tab definition to register.
   */
  register(tab: CompanyTab) {
    this.tabs.set(tab.id, tab);
  }

  /**
   * Unregisters a tab by its ID.
   * @param id The ID of the tab to remove.
   */
  unregister(id: string) {
    this.tabs.delete(id);
  }

  /**
   * Retrieves all registered tabs, sorted by their order.
   * @returns Array of CompanyTab objects.
   */
  getTabs(): CompanyTab[] {
    return Array.from(this.tabs.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  }

  /**
   * Clears all registered tabs (mostly for testing cleanup).
   */
  clear() {
    this.tabs.clear();
  }
}

/**
 * Singleton instance of the CompanyTabRegistry.
 */
export const companyTabRegistry = new CompanyTabRegistry();
