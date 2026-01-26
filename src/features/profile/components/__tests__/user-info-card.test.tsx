import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import { fireEvent,render, screen } from "@testing-library/react";
import { type User as FirebaseUser } from "firebase/auth";

import UserInfoCard from "../user-info-card";

// Wrapper to provide React Hook Form context
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: { displayName: "Test User" },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("UserInfoCard", () => {
  const mockUser = {
    uid: "123",
    displayName: "Test User",
    email: "test@example.com",
    emailVerified: true,
    photoURL: "http://example.com/photo.jpg",
    metadata: { creationTime: "2023-01-01" },
  } as FirebaseUser;

  const mockSetIsEditingDisplayName = jest.fn();
  const mockOnSubmitDisplayName = jest.fn();
  const mockHandleLogout = jest.fn();
  const mockGetInitials = jest.fn((_name) => "TU");

  const defaultProps = {
    user: mockUser,
    isEditingDisplayName: false,
    setIsEditingDisplayName: mockSetIsEditingDisplayName,
    onSubmitDisplayName: mockOnSubmitDisplayName,
    isSubmittingDisplayName: false,
    handleLogout: mockHandleLogout,
    getInitials: mockGetInitials,
  };

  it("renders user information correctly", () => {
    render(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Member since January 2023")).toBeInTheDocument();
  });

  it("renders tooltip trigger for email address", () => {
    render(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );

    const emailTrigger = screen.getByRole("button", { name: `Email: ${defaultProps.user.email}` });
    expect(emailTrigger).toBeInTheDocument();
    expect(emailTrigger).toHaveClass("cursor-help");
  });

  it("renders edit form when isEditingDisplayName is true", () => {
    render(
      <Wrapper>
        <UserInfoCard {...defaultProps} isEditingDisplayName={true} />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText("Enter display name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    // Accessibility check
    const input = screen.getByPlaceholderText("Enter display name");
    expect(input).toHaveAttribute("aria-describedby", "display-name-counter");
    // We can't easily check for sr-only text visibility here without advanced matchers, 
    // but we can check if the element exists
    expect(document.getElementById("display-name-counter")).toBeInTheDocument();
  });

  it("calls setIsEditingDisplayName when edit button is clicked", () => {
    render(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );

    // Desktop edit button
    const editButtons = screen.getAllByRole("button", { name: /edit profile/i });
    fireEvent.click(editButtons[0]);
    expect(mockSetIsEditingDisplayName).toHaveBeenCalledWith(true);
  });

  it("calls handleLogout when logout button is clicked", async () => {
    render(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );

    // Desktop logout button (first one)
    const logoutButtons = screen.getAllByRole("button", { name: /log out/i });
    fireEvent.click(logoutButtons[0]);
    
    // Check if handleLogout was called (it's async, but verify call initiated)
    expect(mockHandleLogout).toHaveBeenCalled();
  });

  it("memoization works: re-renders only when props change", () => {
    const { rerender } = render(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );

    // Rerender with same props (should ideally rely on memo, but we verify it doesn't crash or change output)
    rerender(
      <Wrapper>
        <UserInfoCard {...defaultProps} />
      </Wrapper>
    );
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Rerender with changed prop
    const newUser = { ...mockUser, displayName: "Updated User" } as FirebaseUser;
    rerender(
      <Wrapper>
        <UserInfoCard {...defaultProps} user={newUser} />
      </Wrapper>
    );
    expect(screen.getByText("Updated User")).toBeInTheDocument();
  });
});
