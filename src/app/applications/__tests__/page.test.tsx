import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApplicationsPage from "@/app/applications/page";
import { useAuth } from "@/contexts/auth-context";
import { getJobApplications } from "@/lib/firestore/jobApplications";
import { JobApplication } from "@/types/job-application";

jest.mock("@/contexts/auth-context");
jest.mock("@/lib/firestore/jobApplications");

jest.mock("lucide-react", () => ({
    MoreHorizontal: () => <div data-testid="more-horizontal" />,
    ChevronDown: () => <div data-testid="chevron-down" />,
    ChevronUp: () => <div data-testid="chevron-up" />,
    Check: () => <div data-testid="check" />,
}));

const mockUseAuth = useAuth as jest.Mock;
const mockGetJobApplications = getJobApplications as jest.Mock;

describe("ApplicationsPage", () => {
  const applications: JobApplication[] = [
    {
      id: "1",
      userId: "user-1",
      companyName: "Google",
      position: "Software Engineer",
      status: "Applied",
      dateApplied: "2023-01-01",
      jobType: "FULL TIME",
      statusHistory: [],
    },
    {
      id: "2",
      userId: "user-1",
      companyName: "Facebook",
      position: "Product Manager",
      status: "Interview",
      dateApplied: "2023-01-02",
      jobType: "REMOTE",
      statusHistory: [],
    },
  ];

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { uid: "user-1" }, loading: false });
    mockGetJobApplications.mockResolvedValue(applications);
  });

  it("filters applications by search term", async () => {
    render(<ApplicationsPage />);
    await screen.findByText("Google");

    fireEvent.change(screen.getByPlaceholderText("Search by company or position..."), {
      target: { value: "Google" },
    });

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
  });
});
