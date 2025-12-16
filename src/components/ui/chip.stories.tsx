import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "selected"],
    },
    selected: {
      control: "boolean",
    },

  },
  args: {
    onClick: () => {},
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Chip",
    variant: "default",
  },
};

export const Selected: Story = {
  args: {
    children: "Selected Chip",
    variant: "selected",
    selected: true,
  },
};
