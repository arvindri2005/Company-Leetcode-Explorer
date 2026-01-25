import { render, screen, waitFor } from "@testing-library/react";
import { applyActionCode } from "firebase/auth";

import { Logger } from "@/lib/utils/logger";

import VerifyEmail from "../verify-email";

// Mocks
jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  applyActionCode: jest.fn(),
}));

jest.mock("@/lib/api/firebase", () => ({
  auth: {},
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("VerifyEmail Component", () => {
  const mockApplyActionCode = applyActionCode as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state with accessible role", () => {
    mockApplyActionCode.mockImplementation(() => new Promise(() => {})); // Hang forever
    render(<VerifyEmail oobCode="valid-code" />);
    
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveTextContent("Verifying your email address...");
    
    // Check hidden icon
    // Note: testing-library doesn't easily query hidden elements unless configured, 
    // but we can check if the icon is present in the container
    // or we can assume if the text is there, the structure is correct.
  });

  it("renders success state with accessible role", async () => {
    mockApplyActionCode.mockResolvedValue();
    render(<VerifyEmail oobCode="valid-code" />);

    await waitFor(() => {
      expect(screen.getByText("Email Verified!")).toBeInTheDocument();
      // Specifically check for the role
      const successRegion = screen.getByRole("status");
      expect(successRegion).toHaveTextContent("Email Verified!");
    });
  });

  it("renders error state with alert role", async () => {
    mockApplyActionCode.mockRejectedValue(new Error("Invalid code"));
    render(<VerifyEmail oobCode="invalid-code" />);

    await waitFor(() => {
      const alertRegion = screen.getByRole("alert");
      expect(alertRegion).toBeInTheDocument();
      expect(alertRegion).toHaveTextContent("Verification Failed");

      expect(Logger.error).toHaveBeenCalledWith(
        "Email verification error:",
        expect.any(Error)
      );
    });
  });

  it("renders error state immediately if no oobCode", async () => {
    render(<VerifyEmail oobCode={null} />);

    await waitFor(() => {
        const alertRegion = screen.getByRole("alert");
        expect(alertRegion).toBeInTheDocument();
        expect(alertRegion).toHaveTextContent("Invalid verification link");
    });
  });
});
