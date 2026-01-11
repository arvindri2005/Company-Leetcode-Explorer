import { type LastAskedPeriod,type ProblemStatus } from "../types";

/**
 * @description Options for selecting the last asked period in UI elements, with user-friendly labels.
 */
export const lastAskedPeriodOptions: ReadonlyArray<{
  value: LastAskedPeriod;
  label: string;
}> = [
  { value: "last_30_days", label: "In the last 30 days" },
  { value: "within_3_months", label: "Within 1-3 months" },
  { value: "within_6_months", label: "Within 3-6 months" },
  { value: "older_than_6_months", label: "Older than 6 months" },
] as const;

/**
 * @description Mapping from LastAskedPeriod values to display-friendly strings.
 */
export const lastAskedPeriodDisplayMap: Record<LastAskedPeriod, string> = {
  last_30_days: "Last 30 days",
  within_3_months: "1-3 months ago",
  within_6_months: "3-6 months ago",
  older_than_6_months: "Over 6 months ago",
};

/**
 * @description Options for selecting problem status in UI elements.
 */
export const PROBLEM_STATUS_OPTIONS: ReadonlyArray<{
  value: ProblemStatus;
  label: string;
  description: string;
}> = [
  { value: "none", label: "No Status", description: "Clear current status." },
  { value: "todo", label: "To-Do", description: "Mark as planned to solve." },
  {
    value: "attempted",
    label: "Attempted",
    description: "Mark as attempted but not fully solved.",
  },
  {
    value: "solved",
    label: "Solved",
    description: "Mark as successfully solved.",
  },
] as const;

/**
 * @description Display properties (label, icon, color) for each problem status (excluding 'none').
 */
export const PROBLEM_STATUS_DISPLAY: Record<
  Exclude<ProblemStatus, "none">,
  { label: string; iconName?: string; colorClass?: string }
> = {
  solved: {
    label: "Solved",
    iconName: "CheckCircle2",
    colorClass: "text-green-500",
  },
  attempted: {
    label: "Attempted",
    iconName: "Pencil",
    colorClass: "text-yellow-500",
  },
  todo: { label: "To-Do", iconName: "ListTodo", colorClass: "text-blue-500" },
};






