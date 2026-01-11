import { render, screen } from "@testing-library/react";

import ProblemSubmissionForm from "./problem-submission-form";

// Mock server actions
jest.mock("@/app/actions", () => ({
  addProblem: jest.fn().mockResolvedValue({ success: true, data: { title: "New Problem" } }),
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock ResizeObserver for some UI components if needed, or if Textarea autosize is used
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockCompanies = [
  { id: "1", name: "Google", slug: "google", logo: "" },
];

describe("ProblemSubmissionForm", () => {
  it("renders form fields correctly", () => {
    // ProblemSubmissionForm uses a lot of UI components that might be async or heavy.
    // We mainly check for labels.
    render(<ProblemSubmissionForm companies={mockCompanies} />);
    expect(screen.getByText("Problem Title")).toBeInTheDocument();
    expect(screen.getByText("Difficulty")).toBeInTheDocument();
    expect(screen.getByText("LeetCode Link")).toBeInTheDocument();
  });

  it("shows company missing message if no companies", () => {
    render(<ProblemSubmissionForm companies={[]} />);
    expect(screen.getByText(/Cannot submit problem: No companies found/)).toBeInTheDocument();
  });
});






