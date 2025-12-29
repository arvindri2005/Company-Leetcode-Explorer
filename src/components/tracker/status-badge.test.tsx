import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";
import { JobApplicationStatus } from "@/types/job-application";

describe("StatusBadge", () => {
  const statuses: JobApplicationStatus[] = [
    "Wishlist",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
  ];

  statuses.forEach((status) => {
    it(`renders correct text for status: ${status}`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  });

  it("applies different classes for different statuses", () => {
      const { container: container1 } = render(<StatusBadge status="Applied" />);
      const { container: container2 } = render(<StatusBadge status="Rejected" />);

      const badge1 = container1.querySelector('div');
      const badge2 = container2.querySelector('div');

      expect(badge1).not.toHaveClass(badge2?.className || '');
  });
});
