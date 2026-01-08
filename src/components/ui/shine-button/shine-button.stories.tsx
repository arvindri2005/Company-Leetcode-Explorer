import type { Meta, StoryObj } from "@storybook/react";
import ShineButton from "./shine-button";
import { Rocket, Heart, Star } from "lucide-react";

const meta = {
  title: "UI/ShineButton",
  component: ShineButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: "select",
      options: ["Rocket", "Heart", "Star", "None"],
      mapping: {
        Rocket: Rocket,
        Heart: Heart,
        Star: Star,
        None: undefined,
      },
    },
    disabled: { control: "boolean" },
  },
  args: {
    onClick: () => {},
    children: "Get Started",
  },
} satisfies Meta<typeof ShineButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Rocket,
  },
};

export const NoIcon: Story = {
  args: {
    icon: undefined,
    children: "No Icon Button",
  },
};

export const CustomText: Story = {
  args: {
    icon: Star,
    children: "Star This Project",
  },
};






