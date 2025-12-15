import type { Meta, StoryObj } from "@storybook/react";
import ProblemCard from "./problem-card";
import { LeetCodeProblem } from "@/types";

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  acceptanceRate: 49.2,
  frequency: 5,
  url: "https://leetcode.com/problems/two-sum",
  tags: ["Array", "Hash Table"],
  companyIds: ["google", "facebook"],
  link: "https://leetcode.com/problems/two-sum",
  questionId: "1",
  isPaidOnly: false,
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
