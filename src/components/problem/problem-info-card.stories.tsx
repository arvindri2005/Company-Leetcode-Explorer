import type { Meta, StoryObj } from "@storybook/react";
import ProblemInfoCard from "./problem-info-card";
import { LeetCodeProblem } from "@/types";

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  acceptanceRate: 33.8,
  frequency: 8,
  url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
  tags: ["Hash Table", "String", "Sliding Window"],
  companyIds: ["amazon", "meta"],
  link: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
  questionId: "3",
  isPaidOnly: false,
  lastAskedPeriod: "last_30_days",
};

const meta = {
  title: "Problem/ProblemInfoCard",
  component: ProblemInfoCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    problemStatus: {
      control: "radio",
      options: ["solved", "attempted", "todo", "none"],
    },
    initialIsBookmarked: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ProblemInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    problem: mockProblem,
  },
};

export const Solved: Story = {
  args: {
    problem: mockProblem,
    problemStatus: "solved",
  },
};

export const Bookmarked: Story = {
  args: {
    problem: mockProblem,
    initialIsBookmarked: true,
  },
};
