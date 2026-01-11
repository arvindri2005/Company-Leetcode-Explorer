import type { Meta, StoryObj } from "@storybook/react";

import { type LeetCodeProblem } from "../../types";

import ProblemInfoCard from "./problem-info-card";

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  tags: ["Hash Table", "String", "Sliding Window"],
  companyIds: ["amazon", "meta"],
  link: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
  lastAskedPeriod: "last_30_days",
  companyId: "amazon",
  companySlug: "amazon",
  slug: "longest-substring-without-repeating-characters",
  normalizedTitle: "longest-substring-without-repeating-characters",
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






