import { render, screen } from "@testing-library/react";
import { AITooltipContent } from "./ai-tooltip-content";
import { User } from "firebase/auth";

// Mock hooks
jest.mock("@/features/ai/hooks/use-ai-cooldown", () => ({
  useAICooldown: () => ({
    canUseAI: true,
    isLoadingCooldown: false,
    formattedRemainingTime: "",
  }),
}));

const mockUser = {
    uid: '123'
} as User;

describe("AITooltipContent", () => {
  it("renders default text when user is logged in and can use AI", () => {
    render(<AITooltipContent defaultText="Generate Hints" user={mockUser} />);
    expect(screen.getByText("Generate Hints")).toBeInTheDocument();
  });

  it("renders login message when user is not logged in", () => {
    render(<AITooltipContent defaultText="Generate Hints" user={null} />);
    expect(screen.getByText("Login to use AI features")).toBeInTheDocument();
  });
});






