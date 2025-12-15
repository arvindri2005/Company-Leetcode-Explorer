import type { Meta, StoryObj } from "@storybook/react";
import AllProblemsList from "./all-problems-list";
import { LeetCodeProblem } from "@/types";

const mockProblems: LeetCodeProblem[] = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    acceptanceRate: 49.2,
    frequency: 5,
    url: "https://leetcode.com/problems/two-sum",
    tags: ["Array", "Hash Table"],
    companyIds: ["google"],
    link: "https://leetcode.com/problems/two-sum",
    questionId: "1",
    isPaidOnly: false,
    companySlug: "unknown",
  },
  {
      id: "2",
      title: "Add Two Numbers",
      difficulty: "Medium",
      acceptanceRate: 39.0,
      frequency: 4,
      url: "https://leetcode.com/problems/add-two-numbers",
      tags: ["Linked List", "Math"],
      companyIds: ["amazon"],
      link: "https://leetcode.com/problems/add-two-numbers",
      questionId: "2",
      isPaidOnly: false,
      companySlug: "unknown",
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
