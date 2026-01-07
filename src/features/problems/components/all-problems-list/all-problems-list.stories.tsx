import type { Meta, StoryObj } from "@storybook/react";
import AllProblemsList from "./all-problems-list";
import { LeetCodeProblem } from "../../types";

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
    companySlug: "unknown",
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
      companySlug: "unknown",
      normalizedTitle: "add two numbers",
  }
];

const meta = {
  title: "Problem/AllProblemsList",
  component: AllProblemsList,
  parameters: {
    layout: "padded",
     nextjs: {
        appDirectory: true,
    }
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AllProblemsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialProblems: mockProblems,
    itemsPerPage: 10,
    initialFilters: {
        difficultyFilter: [],
        lastAskedFilter: [],
        statusFilter: [],
        searchTerm: "",
        sortKey: "title"
    },
    totalPages: 1,
    currentPage: 1,
    hasMore: false,
    initialNextCursor: undefined,
  },
};
