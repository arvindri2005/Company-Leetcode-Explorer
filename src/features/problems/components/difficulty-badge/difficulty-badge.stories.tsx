import type { Meta, StoryObj } from "@storybook/react";
import DifficultyBadge from "./difficulty-badge";

const meta = {
  title: "Problem/DifficultyBadge",
  component: DifficultyBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    difficulty: {
      control: "select",
      options: ["Easy", "Medium", "Hard"],
    },
  },
} satisfies Meta<typeof DifficultyBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Easy: Story = {
  args: {
    difficulty: "Easy",
  },
};

export const Medium: Story = {
  args: {
    difficulty: "Medium",
  },
};

export const Hard: Story = {
  args: {
    difficulty: "Hard",
  },
};






