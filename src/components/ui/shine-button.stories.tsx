import type { Meta, StoryObj } from "@storybook/react";
import ShineButton from "./shine-button";
import { FaRocket, FaHeart, FaStar } from "react-icons/fa";

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
        Rocket: FaRocket,
        Heart: FaHeart,
        Star: FaStar,
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
    icon: FaRocket,
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
    icon: FaStar,
    children: "Star This Project",
  },
};
