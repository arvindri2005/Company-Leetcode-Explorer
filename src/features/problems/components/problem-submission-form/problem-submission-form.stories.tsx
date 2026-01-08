import type { Meta, StoryObj } from "@storybook/react";
import ProblemSubmissionForm from "./problem-submission-form";
import { Company } from "@/types";

const mockCompanies: Company[] = [
  { id: "1", name: "Google", slug: "google", logo: "" },
  { id: "2", name: "Facebook", slug: "facebook", logo: "" },
];

const meta = {
  title: "Problem/ProblemSubmissionForm",
  component: ProblemSubmissionForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProblemSubmissionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companies: mockCompanies,
  },
};

export const NoCompanies: Story = {
  args: {
    companies: [],
  },
};






