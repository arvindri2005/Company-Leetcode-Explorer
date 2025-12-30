import type { Meta, StoryObj } from "@storybook/react";
import ProblemListControls from "./problem-list-controls";
import { useState } from "react";
import { DifficultyFilter, LastAskedFilter, SortKey, StatusFilter } from "@/types";

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
    const [sortKey, setSortKey] = useState<SortKey>('difficulty');

    return (
        <ProblemListControls
            difficultyFilter={difficulty}
            onDifficultyFilterChange={setDifficulty}
            lastAskedFilter={lastAsked}
            onLastAskedFilterChange={setLastAsked}
            statusFilter={status}
            onStatusFilterChange={setStatus}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
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
        sortKey: "difficulty",
        onSortKeyChange: () => {},
        showStatusFilter: true,
    },
    render: () => <ProblemListControlsWrapper />
};

export const Default: Story = {
  args: {
    difficultyFilter: [],
    onDifficultyFilterChange: () => {},
    sortKey: "difficulty",
    onSortKeyChange: () => {},
    lastAskedFilter: [],
    onLastAskedFilterChange: () => {},
    statusFilter: [],
    onStatusFilterChange: () => {},
    showStatusFilter: true,
  },
};
