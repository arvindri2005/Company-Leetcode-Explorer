import { render, screen, fireEvent } from "@testing-library/react";
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
        sortKey="difficulty"
        onSortKeyChange={jest.fn()}
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
        sortKey="difficulty"
        onSortKeyChange={jest.fn()}
      />
    );
    
    // Chips are often buttons or divs with click handlers.
    // Assuming Chip renders the text.
    fireEvent.click(screen.getByText("Easy"));
    expect(handleDifficultyChange).toHaveBeenCalledWith(["Easy"]);
  });
});






