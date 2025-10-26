import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddApplicationForm from "../AddApplicationForm";
import { useAuth } from "@/contexts/auth-context";
import { addJobApplication } from "@/lib/firestore/jobApplications";
import { useToast } from "@/hooks/use-toast";

jest.mock("@/contexts/auth-context");
jest.mock("@/lib/firestore/jobApplications");
jest.mock("next/navigation", () => ({
    useRouter: () => ({
      push: jest.fn(),
    }),
}));
jest.mock("@/hooks/use-toast");


const mockUseAuth = useAuth as jest.Mock;
const mockAddJobApplication = addJobApplication as jest.Mock;
const mockUseToast = useToast as jest.Mock;

describe("AddApplicationForm", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
        user: { uid: "test-user" },
        });
        mockUseToast.mockReturnValue({
            toast: jest.fn(),
        });
    });

    it("renders all form fields", () => {
        render(<AddApplicationForm />);

        expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Position")).toBeInTheDocument();
        expect(screen.getByLabelText("Location")).toBeInTheDocument();
        expect(screen.getByLabelText("Company Logo URL")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
        expect(screen.getByLabelText("Job Type")).toBeInTheDocument();
        expect(screen.getByLabelText("Date Applied")).toBeInTheDocument();
        expect(
        screen.getByRole("button", { name: "Add Application" })
        ).toBeInTheDocument();
    });

    it("submits the form with the correct data", async () => {
        mockAddJobApplication.mockResolvedValue("new-app-id");

        render(<AddApplicationForm />);

        fireEvent.change(screen.getByLabelText("Company Name"), {
        target: { value: "Test Company" },
        });
        fireEvent.change(screen.getByLabelText("Position"), {
        target: { value: "Test Position" },
        });
        fireEvent.change(screen.getByLabelText("Location"), {
        target: { value: "Test Location" },
        });
        fireEvent.change(screen.getByLabelText("Date Applied"), {
        target: { value: "2023-01-01" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Add Application" }));

        await waitFor(() => {
        expect(mockAddJobApplication).toHaveBeenCalledWith({
            userId: "test-user",
            companyName: "Test Company",
            position: "Test Position",
            location: "Test Location",
            companyLogoUrl: "",
            status: "Saved",
            jobType: "FULL TIME",
            dateApplied: "2023-01-01",
        });
        });
    });
});
