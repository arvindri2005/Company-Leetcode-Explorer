import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import { fireEvent,render, screen } from "@testing-library/react";
import { type User } from "firebase/auth";

import UserInfoCard from "../user-info-card";

// Mock resize observer if needed
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockUser = {
  uid: "123",
  displayName: "Test User",
  email: "test@example.com",
  emailVerified: true,
  metadata: { creationTime: new Date().toISOString() },
  photoURL: "http://example.com/avatar.jpg",
} as unknown as User;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      displayName: "Test User",
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("UserInfoCard", () => {
  const mockSetIsEditing = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockHandleLogout = jest.fn();
  const mockGetInitials = jest.fn((name) => name ? name[0] : "A");

  it("shows character counter when editing display name", () => {
    render(
      <Wrapper>
        <UserInfoCard
          user={mockUser}
          isEditingDisplayName={true}
          setIsEditingDisplayName={mockSetIsEditing}
          onSubmitDisplayName={mockOnSubmit}
          isSubmittingDisplayName={false}
          handleLogout={mockHandleLogout}
          getInitials={mockGetInitials}
        />
      </Wrapper>
    );

    const input = screen.getByLabelText("Display Name");
    expect(input).toBeInTheDocument();

    // Check for character counter - initially 9 characters ("Test User")
    // Note: The counter text might be split or formatted, but "9/50" should be findable if rendered as a text node
    expect(screen.getByText("9/50")).toBeInTheDocument();

    // Type more characters
    fireEvent.change(input, { target: { value: "Test User Updated" } });
    
    // Check updated counter - 17 characters
    expect(screen.getByText("17/50")).toBeInTheDocument();
  });
});
