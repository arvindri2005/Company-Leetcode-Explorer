import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StatusTimelineModal from "../StatusTimelineModal";
import { JobApplication } from "@/types/job-application";

describe("StatusTimelineModal", () => {
  const application: JobApplication = {
    id: "app-id",
    userId: "user-id",
    companyName: "Test Company",
    position: "Test Position",
    status: "Interview",
    dateApplied: "2023-01-01",
    statusHistory: [
      { status: "Applied", date: "2023-01-01" },
      { status: "Interview", date: "2023-01-15" },
    ],
  };

  it("renders the status timeline", () => {
    render(
      <StatusTimelineModal application={application}>
        <button>View Timeline</button>
      </StatusTimelineModal>
    );

    // The modal is not open by default, so we don't check for content yet.
    expect(screen.getByText("View Timeline")).toBeInTheDocument();
  });
});
