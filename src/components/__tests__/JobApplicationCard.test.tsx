import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JobApplicationCard from "../JobApplicationCard";
import {
  updateJobApplication,
  deleteJobApplication,
} from "@/lib/firestore/jobApplications";
import { JobApplication } from "@/types/job-application";

jest.mock("@/lib/firestore/jobApplications");

jest.mock("@/components/ui/dropdown-menu", () => {
    const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    const DropdownMenuItem = ({ children, onSelect, onClick }: { children: React.ReactNode, onSelect?: (event: Event) => void, onClick?: () => void }) => (
      <div onClick={() => {
        if (onSelect) onSelect(new Event("select"));
        if (onClick) onClick();
      }}>{children}</div>
    );
    return { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
  });

jest.mock("../StatusTimelineModal", () => ({
  __esModule: true,
  default: ({ children, application }: { children: React.ReactNode, application: any }) => (
    <div>
      <div>{children}</div>
      <h2>Status Timeline for {application.companyName}</h2>
    </div>
  ),
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
    statusHistory: [],
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

  it("opens the status timeline modal when 'View Timeline' is clicked", () => {
    render(
      <JobApplicationCard
        application={application}
        onApplicationDeleted={onApplicationDeleted}
        onApplicationUpdated={onApplicationUpdated}
      />
    );

    fireEvent.click(screen.getByText("View Timeline"));

    // Since the modal is now part of the DOM, we can check for its title
    expect(screen.getByText(/Status Timeline for/)).toBeInTheDocument();
  });
});
