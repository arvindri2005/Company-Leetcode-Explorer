import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { type DifficultyFilter, type LastAskedFilter, type StatusFilter } from "../../types";

import ProblemListControls from "./problem-list-controls";

const meta = {
  title: "Problem/ProblemListControls",
  component: ProblemListControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProblemListControls>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper for interactive story
const ProblemListControlsWrapper = () => {
    const [difficulty, setDifficulty] = useState<DifficultyFilter[]>([]);
    const [lastAsked, setLastAsked] = useState<LastAskedFilter[]>([]);
    const [status, setStatus] = useState<StatusFilter[]>([]);

    return (
        <ProblemListControls
            difficultyFilter={difficulty}
            onDifficultyFilterChange={setDifficulty}
            lastAskedFilter={lastAsked}
            onLastAskedFilterChange={setLastAsked}
            statusFilter={status}
            onStatusFilterChange={setStatus}
            showStatusFilter={true}
        />
    )
}

export const Interactive: Story = {
    // Arguments are required by TypeScript to match the component props,
    // even though the render function ignores them in favor of the wrapper.
    args: {
        difficultyFilter: [],
        onDifficultyFilterChange: () => {},
        lastAskedFilter: [],
        onLastAskedFilterChange: () => {},
        statusFilter: [],
        onStatusFilterChange: () => {},
        showStatusFilter: true,
    },
    render: () => <ProblemListControlsWrapper />
};

export const Default: Story = {
  args: {
    difficultyFilter: [],
    onDifficultyFilterChange: () => {},
    lastAskedFilter: [],
    onLastAskedFilterChange: () => {},
    statusFilter: [],
    onStatusFilterChange: () => {},
    showStatusFilter: true,
  },
};





