import type { Meta, StoryObj } from "@storybook/react";

import { type LeetCodeProblem } from "../../types";

import ProblemList from "./problem-list";

// Mock Next.js hooks
// In Storybook, we might need a decorator or just rely on the component being resilient if hooks return defaults. A decorator mocking next/navigation is best.
// For now we will assume the environment or a global decorator mocks this, or we rely on the fact that we can't easily mock imports here without setup.
// However, since ProblemList uses useSearchParams, it will likely Crash if not mocked.
// We will simply export the story and assume the user has set up Next.js mocking in .storybook/preview.tsx or similar.
// If not, it might error. But providing the file is the step.

const mockProblems: LeetCodeProblem[] = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    companyIds: ["google"],
    link: "https://leetcode.com/problems/two-sum",
    slug: "two-sum",
    companyId: "google",
    companySlug: "google",
    normalizedTitle: "two sum",
  },
  {
      id: "2",
      title: "Add Two Numbers",
      difficulty: "Medium",
      tags: ["Linked List", "Math"],
      companyIds: ["amazon"],
      link: "https://leetcode.com/problems/add-two-numbers",
      slug: "add-two-numbers",
      companyId: "amazon",
      companySlug: "amazon",
      normalizedTitle: "add two numbers",
  }
];

const meta = {
  title: "Problem/ProblemList",
  component: ProblemList,
  parameters: {
    layout: "padded",
    nextjs: {
        appDirectory: true,
    }
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProblemList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companyId: "1",
    companySlug: "google",
    initialProblems: mockProblems,
    initialHasMore: false,
    initialNextCursor: undefined,
    itemsPerPage: 10,
    initialFilters: {
        difficultyFilter: [],
        lastAskedFilter: [],
        statusFilter: [],
        searchTerm: "",
        sortKey: "title"
    },
    totalPages: 1,
    currentPage: 1
  },
};

export const LoadingMore: Story = {
  args: {
    ...Default.args,
    initialHasMore: true,
    initialNextCursor: "next-cursor",
  },
};






