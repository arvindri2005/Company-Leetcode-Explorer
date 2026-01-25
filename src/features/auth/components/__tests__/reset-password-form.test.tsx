import { useRouter } from "next/navigation";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { verifyPasswordResetCode } from "firebase/auth";

import { useToast } from "@/hooks/use-toast";

import ResetPasswordForm from "../reset-password-form";

// Mocks
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  confirmPasswordReset: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
}));

jest.mock("@/lib/api/firebase", () => ({
  auth: {},
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

// Mock Link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ResetPasswordForm UX", () => {
  const mockVerifyPasswordResetCode = verifyPasswordResetCode as jest.Mock;
  const mockToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("renders form with required field indicators after verification", async () => {
    mockVerifyPasswordResetCode.mockResolvedValue("test@example.com");

    render(<ResetPasswordForm oobCode="valid-code" />);

    // Wait for verification
    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    // Check for "New Password *"
    // Note: The asterisk is in a separate span, so getByLabelText might not include it exactly if it's strict,
    // but the Label text includes it. Let's check the text content of the label.
    // getByText can find it if we are specific about the container or use a function.
    
    // Check for "New Password" text node's parent having the asterisk
    const passwordLabel = screen.getByText("New Password");
    expect(passwordLabel).toBeInTheDocument();
    // Verify asterisk presence in the same container or next to it
    // The structure is <Label>New Password <span class="text-destructive">*</span></Label>
    // Testing Library's getByText("New Password") usually matches the text node.
    // Let's inspect the HTML structure more loosely or search for the asterisk specifically.
    
    // We can search for the asterisk with the specific class
    const asterisks = document.querySelectorAll(".text-destructive");
    expect(asterisks.length).toBeGreaterThanOrEqual(2); // At least 2 for password and confirm
    expect(asterisks[0].textContent).toBe("*");
  });

  it("shows password strength indicator", async () => {
    mockVerifyPasswordResetCode.mockResolvedValue("test@example.com");

    render(<ResetPasswordForm oobCode="valid-code" />);

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    
    // Type a weak password
    await userEvent.type(passwordInput, "weak");

    // Check if strength indicator requirements are shown
    expect(screen.getByText("8+ characters", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Uppercase letter", { exact: false })).toBeInTheDocument();
  });

  it("updates password strength indicator as user types", async () => {
    mockVerifyPasswordResetCode.mockResolvedValue("test@example.com");

    render(<ResetPasswordForm oobCode="valid-code" />);

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    
    // Initially, nothing met
    expect(screen.getByText("8+ characters", { exact: false })).toHaveTextContent("requirement not met");

    // Type a valid password part
    await userEvent.type(passwordInput, "StrongPass1!");

    // Should verify that the strength meter is updating. 
    // Since we re-use SignupPasswordStrength which is fully tested, 
    // we just need to ensure it's receiving the props.
    // We can check if one of the requirements flips to "met".
    
    // "Uppercase letter" should be met
    const uppercaseLabel = screen.getByText("Uppercase letter", { exact: false });
    expect(uppercaseLabel).toHaveTextContent("requirement met");
  });
});
