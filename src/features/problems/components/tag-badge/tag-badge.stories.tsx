import type { Meta, StoryObj } from "@storybook/react";
import TagBadge from "./tag-badge";

const meta = {
  title: "Problem/TagBadge",
  component: TagBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tag: {
      control: "text",
    },
  },
} satisfies Meta<typeof TagBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tag: "Array",
  },
};

export const LongTag: Story = {
  args: {
    tag: "Dynamic Programming",
  },
};






