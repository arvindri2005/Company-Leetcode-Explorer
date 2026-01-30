import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sendPasswordResetEmail } from "firebase/auth";

import { useToast } from "@/shared/hooks/use-toast";
import { Logger } from "@/shared/lib/utils/logger";

import ForgotPasswordForm from "../forgot-password-form";

// Mocks
jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("@/shared/lib/api/firebase", () => ({
  auth: {},
}));

jest.mock("@/shared/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

// Mock Link since it's used in the component
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ForgotPasswordForm Security", () => {
  const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.Mock;
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("should treat 'user-not-found' error as success to prevent email enumeration", async () => {
    // Simulate user-not-found error from Firebase
    const error = new Error("User not found");
    (error as any).code = "auth/user-not-found";
    mockSendPasswordResetEmail.mockRejectedValue(error);

    render(<ForgotPasswordForm />);

    // Fill in email
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "nonexistent@example.com");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /send reset link/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // It should NOT show an error toast
      expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({
        title: "Request Failed",
      }));

      // It SHOULD log the error internally for auditing
      expect(Logger.error).toHaveBeenCalledWith(
        "Forgot Password error:",
        expect.any(Error)
      );

      // It SHOULD show the success message
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/we have sent a password reset link/i)).toBeInTheDocument();
    });
  });

  it("should show success state for valid email", async () => {
    mockSendPasswordResetEmail.mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "existing@example.com");

    const submitButton = screen.getByRole("button", { name: /send reset link/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("should handle other errors generically", async () => {
     // Simulate generic error
     const error = new Error("Some network error");
     (error as any).code = "auth/network-request-failed";
     mockSendPasswordResetEmail.mockRejectedValue(error);
 
     render(<ForgotPasswordForm />);
 
     const emailInput = screen.getByLabelText(/email/i);
     await userEvent.type(emailInput, "test@example.com");
 
     const submitButton = screen.getByRole("button", { name: /send reset link/i });
     await userEvent.click(submitButton);
 
     await waitFor(() => {
       // Should show error toast
       expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
         title: "Request Failed",
         // description: expect.stringMatching(/an unknown error occurred|network error/i), 
         // In my fix I hardcoded "An error occurred. Please try again." for default cases to not leak info.
         description: "An error occurred. Please try again.",
       }));

       // Should log the error
       expect(Logger.error).toHaveBeenCalledWith(
         "Forgot Password error:",
         expect.any(Error)
       );
       
       // Should NOT show success state
       expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
     });
  });

  it("should allow user to retry with another email from success state", async () => {
    mockSendPasswordResetEmail.mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "wrong@example.com");

    const submitButton = screen.getByRole("button", { name: /send reset link/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Click try another email
    const retryButton = screen.getByRole("button", { name: /try another email/i });
    await userEvent.click(retryButton);

    // Should be back at form with value preserved
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveValue("wrong@example.com");
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    });
  });
});
