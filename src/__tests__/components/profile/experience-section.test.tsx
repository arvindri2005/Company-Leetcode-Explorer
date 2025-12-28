import { render, screen } from "@testing-library/react";
import WorkExperienceSection from "@/components/profile/work-experience-section";
import EducationExperienceSection from "@/components/profile/education-experience-section";
import { WorkExperience, EducationExperience } from "@/types";

// Mock dependencies
jest.mock("react-hook-form", () => ({
  ...jest.requireActual("react-hook-form"),
  useFormContext: () => ({
    handleSubmit: jest.fn(),
    control: {},
    formState: { isSubmitting: false },
    register: jest.fn(),
  }),
  FormProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  PlusCircle: () => <span data-testid="icon-plus-circle" />,
  Briefcase: () => <span data-testid="icon-briefcase" />,
  GraduationCap: () => <span data-testid="icon-graduation-cap" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

// Mock Skeleton
jest.mock("@/components/skeletons/experience-skeleton", () => ({
  WorkExperienceSkeleton: () => <div data-testid="work-experience-skeleton">Skeleton</div>,
  EducationExperienceSkeleton: () => <div data-testid="education-experience-skeleton">Skeleton</div>,
}));

describe("Experience Sections", () => {
  describe("WorkExperienceSection", () => {
    const mockWorkExperience: WorkExperience[] = [
      {
        id: "1",
        jobTitle: "Software Engineer",
        companyName: "Tech Corp",
        startDate: "01/2022",
        endDate: "Present",
        responsibilities: "Building cool stuff.",
      },
    ];

    it("renders loading skeletons when isLoadingWorkExperience is true", () => {
      render(
        <WorkExperienceSection
          userId="123"
          workExperience={[]}
          isLoadingWorkExperience={true}
          handleAddWorkExperience={jest.fn()}
          isWorkDialogOpen={false}
          setIsWorkDialogOpen={jest.fn()}
        />
      );

      // Should render at least one skeleton
      expect(screen.getAllByTestId("work-experience-skeleton").length).toBeGreaterThan(0);
    });

    it("renders work experience items when loaded", () => {
      render(
        <WorkExperienceSection
          userId="123"
          workExperience={mockWorkExperience}
          isLoadingWorkExperience={false}
          handleAddWorkExperience={jest.fn()}
          isWorkDialogOpen={false}
          setIsWorkDialogOpen={jest.fn()}
        />
      );

      expect(screen.getByText("Software Engineer at Tech Corp")).toBeInTheDocument();
      expect(screen.queryByTestId("work-experience-skeleton")).not.toBeInTheDocument();
    });
  });

  describe("EducationExperienceSection", () => {
    const mockEducation: EducationExperience[] = [
      {
        id: "1",
        school: "University of Tech",
        degree: "BSc",
        major: "Computer Science",
        graduationYear: "2022",
      },
    ];

    it("renders loading skeletons when isLoadingEducation is true", () => {
      render(
        <EducationExperienceSection
          userId="123"
          educationHistory={[]}
          isLoadingEducation={true}
          handleAddEducation={jest.fn()}
          isEducationDialogOpen={false}
          setIsEducationDialogOpen={jest.fn()}
        />
      );

      expect(screen.getAllByTestId("education-experience-skeleton").length).toBeGreaterThan(0);
    });

    it("renders education items when loaded", () => {
      render(
        <EducationExperienceSection
          userId="123"
          educationHistory={mockEducation}
          isLoadingEducation={false}
          handleAddEducation={jest.fn()}
          isEducationDialogOpen={false}
          setIsEducationDialogOpen={jest.fn()}
        />
      );

      expect(screen.getByText("BSc in Computer Science")).toBeInTheDocument();
      expect(screen.queryByTestId("education-experience-skeleton")).not.toBeInTheDocument();
    });
  });
});
