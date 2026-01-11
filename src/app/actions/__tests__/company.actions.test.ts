import { addCompany, fetchCompaniesAction, fetchCompanySuggestionsAction } from "../company.actions";
import { companyService } from "@/features/companies/services/company.service";
import { Logger } from "@/lib/utils/logger";

jest.mock("@/features/companies/services/company.service");
jest.mock("@/lib/utils/logger");
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

describe("Company Actions Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addCompany", () => {
    it("should log error and return clean message when service fails", async () => {
      const error = new Error("Service failed");
      (companyService.addCompany as jest.Mock).mockRejectedValue(error);

      const result = await addCompany({ name: "Test Corp" });

      expect(Logger.error).toHaveBeenCalledWith(
        "Action failed: addCompany",
        error,
        expect.objectContaining({
          name: "Test Corp",
          originalError: "Service failed",
        })
      );
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Service failed");
    });
  });

  describe("fetchCompaniesAction", () => {
    it("should log error and return clean message when service fails", async () => {
      const error = new Error("DB Error");
      (companyService.getCompanies as jest.Mock).mockRejectedValue(error);

      const result = await fetchCompaniesAction(1, 10);

      expect(Logger.error).toHaveBeenCalledWith(
        "Action failed: fetchCompaniesAction",
        error,
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          originalError: "DB Error",
        })
      );
      expect(result.error?.message).toBe("DB Error");
    });
  });
});






