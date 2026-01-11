import type { Meta, StoryObj } from "@storybook/react";

import { type LeetCodeProblem } from "../../types";

import ProblemCard from "./problem-card";

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  tags: ["Array", "Hash Table"],
  companyIds: ["google", "facebook"],
  link: "https://leetcode.com/problems/two-sum",
  slug: "two-sum",
  companyId: "google",
  companySlug: "google",
  normalizedTitle: "two sum",
};

const meta = {
  title: "Problem/ProblemCard",
  component: ProblemCard,
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
    showCompanies: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ProblemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    problem: mockProblem,
    companySlug: "google",
    showCompanies: true,
  },
};

export const Solved: Story = {
  args: {
    problem: mockProblem,
    companySlug: "google",
    problemStatus: "solved",
  },
};

export const Bookmarked: Story = {
  args: {
    problem: mockProblem,
    companySlug: "google",
    initialIsBookmarked: true,
  },
};

export const HardProblem: Story = {
  args: {
    problem: { ...mockProblem, title: "Median of Two Sorted Arrays", difficulty: "Hard" },
    companySlug: "google",
  },
};






