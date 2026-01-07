import type { Meta, StoryObj } from "@storybook/react";
import { AITooltipContent } from "./ai-tooltip-content";
import { User } from "firebase/auth";

const mockUser = { uid: "test-user" } as User;

const meta = {
  title: "Problem/AITooltipContent",
  component: AITooltipContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    defaultText: {
      control: "text",
    },
  },
} satisfies Meta<typeof AITooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultText: "Click to generate hints",
    user: mockUser,
  },
};

export const NotLoggedIn: Story = {
  args: {
    defaultText: "Click to generate hints",
    user: null,
  },
};
