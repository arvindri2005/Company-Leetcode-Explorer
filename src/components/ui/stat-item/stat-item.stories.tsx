import type { Meta, StoryObj } from "@storybook/react";
import { StatItem } from "./stat-item";

const meta = {
  title: "UI/StatItem",
  component: StatItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    number: { control: "text" },
    label: { control: "text" },
  },
} satisfies Meta<typeof StatItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    number: "10k+",
    label: "Active Users",
  },
};

export const AnotherMetric: Story = {
  args: {
    number: "99.9%",
    label: "Uptime Guaranteed",
  },
};






