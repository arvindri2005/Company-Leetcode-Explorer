import { fireEvent,render, screen } from "@testing-library/react";

import ProblemListControls from "./problem-list-controls";

describe("ProblemListControls", () => {
  it("renders filter chips", () => {
    render(
      <ProblemListControls
        difficultyFilter={[]}
        onDifficultyFilterChange={jest.fn()}
        lastAskedFilter={[]}
        onLastAskedFilterChange={jest.fn()}
        statusFilter={[]}
        onStatusFilterChange={jest.fn()}
        showStatusFilter={true}
      />
    );
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("calls onDifficultyFilterChange when clicking a difficulty chip", () => {
    const handleDifficultyChange = jest.fn();
    render(
      <ProblemListControls
        difficultyFilter={[]}
        onDifficultyFilterChange={handleDifficultyChange}
        lastAskedFilter={[]}
        onLastAskedFilterChange={jest.fn()}
        statusFilter={[]}
        onStatusFilterChange={jest.fn()}
      />
    );
    
    // Chips are often buttons or divs with click handlers.
    // Assuming Chip renders the text.
    fireEvent.click(screen.getByText("Easy"));
    expect(handleDifficultyChange).toHaveBeenCalledWith(["Easy"]);
  });

  it("renders 'Clear filters' button when filters are active and clears them on click", () => {
    const handleDifficultyChange = jest.fn();
    const handleLastAskedChange = jest.fn();
    const handleStatusChange = jest.fn();

    render(
      <ProblemListControls
        difficultyFilter={["Easy"]}
        onDifficultyFilterChange={handleDifficultyChange}
        lastAskedFilter={[]}
        onLastAskedFilterChange={handleLastAskedChange}
        statusFilter={[]}
        onStatusFilterChange={handleStatusChange}
        showStatusFilter={true}
      />
    );

    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    expect(handleDifficultyChange).toHaveBeenCalledWith([]);
    expect(handleLastAskedChange).toHaveBeenCalledWith([]);
    expect(handleStatusChange).toHaveBeenCalledWith([]);
  });

  it("does not render 'Clear filters' button when no filters are active", () => {
    render(
      <ProblemListControls
        difficultyFilter={[]}
        onDifficultyFilterChange={jest.fn()}
        lastAskedFilter={[]}
        onLastAskedFilterChange={jest.fn()}
        statusFilter={[]}
        onStatusFilterChange={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: /clear filters/i }),
    ).not.toBeInTheDocument();
  });
});






