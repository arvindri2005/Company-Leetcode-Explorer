import { useRouter, useSearchParams } from "next/navigation";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useOnlineStatus } from "@/hooks/use-online-status";

import { authService } from "../../services/auth.service";
import GoogleAuthButton from "../google-auth-button";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../services/auth.service", () => ({
  authService: {
    loginWithGoogle: jest.fn(),
  },
}));

jest.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe("GoogleAuthButton Security", () => {
  const mockPush = jest.fn();
  const mockLoginWithGoogle = authService.loginWithGoogle as jest.Mock;
  const mockUseSearchParams = useSearchParams as jest.Mock;
  const mockUseOnlineStatus = useOnlineStatus as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockUseOnlineStatus.mockReturnValue(true);
    mockLoginWithGoogle.mockResolvedValue({
      success: true,
      data: { displayName: "Test User", email: "test@example.com", uid: "123" },
    });
  });

  it("should prevent open redirect and redirect to profile when URL is invalid", async () => {
    // malicious redirect url
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "redirectUrl" ? "//evil.com" : null),
    });

    render(<GoogleAuthButton />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    await userEvent.click(button);

    await waitFor(() => {
      // It should NOT call push with //evil.com
      // It SHOULD call push with /profile (default fallback)
      expect(mockPush).toHaveBeenCalledWith("/profile");
      expect(mockPush).not.toHaveBeenCalledWith("//evil.com");
    });
  });

  it("should redirect to valid internal URL", async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "redirectUrl" ? "/dashboard" : null),
    });

    render(<GoogleAuthButton />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should respect the disabled prop", () => {
    render(<GoogleAuthButton disabled={true} />);
    const button = screen.getByRole("button", { name: /continue with google/i });
    expect(button).toBeDisabled();
  });
});
