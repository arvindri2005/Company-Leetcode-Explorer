import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JobApplicationCard from "../JobApplicationCard";
import {
  updateJobApplication,
  deleteJobApplication,
} from "@/lib/firestore/jobApplications";
import { JobApplication } from "@/types/job-application";

jest.mock("@/lib/firestore/jobApplications");

jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div onClick={() => {}}>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <div onClick={onClick}>{children}</div>,
}));

jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...props} />;
    },
}));
jest.mock("lucide-react", () => ({
    MoreHorizontal: () => <div data-testid="more-horizontal" />,
    ChevronDown: () => <div data-testid="chevron-down" />,
    ChevronUp: () => <div data-testid="chevron-up" />,
    Check: () => <div data-testid="check" />,
}));

const mockUpdateJobApplication = updateJobApplication as jest.Mock;
const mockDeleteJobApplication = deleteJobApplication as jest.Mock;

describe("JobApplicationCard", () => {
  const onApplicationDeleted = jest.fn();
  const onApplicationUpdated = jest.fn();
  const application: JobApplication = {
    id: "app-id",
    userId: "user-id",
    companyName: "Test Company",
    position: "Test Position",
    status: "Applied",
    dateApplied: "2023-01-01",
    location: "San Francisco, CA",
    jobType: "FULL TIME",
    companyLogoUrl: "https://logo.clearbit.com/google.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the application details", () => {
    render(
      <JobApplicationCard
        application={application}
        onApplicationDeleted={onApplicationDeleted}
        onApplicationUpdated={onApplicationUpdated}
      />
    );

    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Test Position")).toBeInTheDocument();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
    expect(screen.getByText(/full time/i)).toBeInTheDocument();
    expect(screen.getByAltText("Test Company logo")).toBeInTheDocument();
  });

  it("calls the delete function when the delete button is clicked", async () => {
    render(
      <JobApplicationCard
        application={application}
        onApplicationDeleted={onApplicationDeleted}
        onApplicationUpdated={onApplicationUpdated}
      />
    );

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockDeleteJobApplication).toHaveBeenCalledWith("app-id");
      expect(onApplicationDeleted).toHaveBeenCalledWith("app-id");
    });
  });
});
