import React from "react";
import { useFormContext } from "react-hook-form";

import { fireEvent,render, screen } from "@testing-library/react";

import WorkExperienceSection from "../work-experience-section";

// Mock the useFormContext hook
jest.mock("react-hook-form", () => ({
  ...jest.requireActual("react-hook-form"),
  useFormContext: jest.fn(),
  FormProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("WorkExperienceSection", () => {
  const mockHandleAddWorkExperience = jest.fn();
  const mockSetIsWorkDialogOpen = jest.fn();
  const mockFormContext = {
    handleSubmit: jest.fn((fn) => fn),
    control: {},
    formState: { isSubmitting: false },
    register: jest.fn(),
  };

  beforeEach(() => {
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);
  });

  it("renders the empty state when workExperience is empty", () => {
    render(
      <WorkExperienceSection
        userId="user-123"
        workExperience={[]}
        isLoadingWorkExperience={false}
        handleAddWorkExperience={mockHandleAddWorkExperience}
        isWorkDialogOpen={false}
        setIsWorkDialogOpen={mockSetIsWorkDialogOpen}
      />
    );

    // Check for the new empty state elements
    expect(screen.getByText("No work experience")).toBeInTheDocument();
    expect(
      screen.getByText("Add your professional experience to build your profile.")
    ).toBeInTheDocument();
    
    // Check for the button in the empty state
    const addButtons = screen.getAllByText(/Add Work Experience/i);
    // There should be two buttons now: one in the header (original) and one in the empty state
    expect(addButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("opens dialog when empty state button is clicked", () => {
    render(
      <WorkExperienceSection
        userId="user-123"
        workExperience={[]}
        isLoadingWorkExperience={false}
        handleAddWorkExperience={mockHandleAddWorkExperience}
        isWorkDialogOpen={false}
        setIsWorkDialogOpen={mockSetIsWorkDialogOpen}
      />
    );

    // Find the button inside the empty state container (which has text-center class)
    // A simplified way is to click the last "Add Work Experience" button as it's likely the one in the empty state
    const addButtons = screen.getAllByText(/Add Work Experience/i);
    const emptyStateButton = addButtons[addButtons.length - 1];
    
    fireEvent.click(emptyStateButton);
    expect(mockSetIsWorkDialogOpen).toHaveBeenCalledWith(true);
  });
});
