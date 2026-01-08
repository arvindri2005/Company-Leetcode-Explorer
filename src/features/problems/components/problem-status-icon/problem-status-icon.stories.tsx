import type { Meta, StoryObj } from "@storybook/react";
import { ProblemStatusIcon } from "./problem-status-icon";

const meta = {
  title: "Problem/ProblemStatusIcon",
  component: ProblemStatusIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["solved", "attempted", "todo", "none"],
    },
  },
} satisfies Meta<typeof ProblemStatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solved: Story = {
  args: {
    status: "solved",
  },
};

export const Attempted: Story = {
  args: {
    status: "attempted",
  },
};

export const Todo: Story = {
  args: {
    status: "todo",
  },
};

export const None: Story = {
  args: {
    status: "none",
  },
};






