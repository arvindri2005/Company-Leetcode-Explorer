import type { Meta, StoryObj } from "@storybook/react";
import { FloatingShapes } from "./floating-shapes";

const meta = {
  title: "UI/FloatingShapes",
  component: FloatingShapes,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
        default: 'dark',
      },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FloatingShapes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative w-full h-[500px] overflow-hidden bg-slate-900">
      <FloatingShapes />
      <div className="relative z-10 flex items-center justify-center h-full text-white">
        <h1 className="text-4xl font-bold">Content Over Shapes</h1>
      </div>
    </div>
  ),
};
