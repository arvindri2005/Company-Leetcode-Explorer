import type { Meta, StoryObj } from "@storybook/react";
import { Rocket,Shield, Zap } from "lucide-react";

import { FeatureCard } from "./feature-card";

const meta = {
  title: "UI/FeatureCard",
  component: FeatureCard,
  parameters: {
    layout: "centered",
    backgrounds: {
        default: 'dark',
      },
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: "select",
      options: ["Zap", "Shield", "Rocket"],
      mapping: {
        Zap: Zap,
        Shield: Shield,
        Rocket: Rocket,
      },
    },
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<typeof FeatureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Zap,
    title: "Lightning Fast",
    description: "Our platform is optimized for speed, ensuring you get results in milliseconds.",
  },
};

export const Secure: Story = {
  args: {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security built into every layer of our infrastructure.",
  },
};

export const Scalable: Story = {
  args: {
    icon: Rocket,
    title: "Infinite Scalability",
    description: "Grow from one user to one million without changing a single line of code.",
  },
};






