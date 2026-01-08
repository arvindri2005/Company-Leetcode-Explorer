
import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    mode: "single",
    selected: new Date(),
    className: "rounded-md border shadow",
  },
};

export const Multiple: Story = {
  args: {
    mode: "multiple",
    selected: [new Date(), new Date(new Date().setDate(new Date().getDate() + 5))],
    className: "rounded-md border shadow",
  },
};

export const Range: Story = {
  args: {
    mode: "range",
    selected: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 5)),
    },
    className: "rounded-md border shadow",
  },
};
