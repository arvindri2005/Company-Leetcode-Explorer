import { companyService } from "../company.service";
import { companyRepository } from "@/repositories/company.repository";
import { cacheManager } from "@/lib/cache";
import { CacheTTL } from "@/lib/cache/types";

// Mock dependencies
jest.mock("@/repositories/company.repository");
jest.mock("@/lib/cache", () => ({
  cacheManager: {
    wrap: jest.fn(),
    revalidateTag: jest.fn(),
  },
  CacheTTL: {
    STATIC: 2592000,
    SHORT: 300,
  },
}));

describe("CompanyService (with Cache)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getCompanies should call cacheManager.wrap with correct options", async () => {
    const mockCompanies = { companies: [], hasMore: false };
    (cacheManager.wrap as jest.Mock).mockResolvedValue(mockCompanies);

    const params = { pageSize: 10 };
    await companyService.getCompanies(params);

    expect(cacheManager.wrap).toHaveBeenCalledWith(
      expect.stringContaining("companies-public-"),
      expect.any(Function),
      {
        revalidate: CacheTTL.STATIC,
        tags: ["companies-collection-broad"],
      }
    );
  });

  it("getCompanyById should call cacheManager.wrap", async () => {
    const mockCompany = { id: "1", name: "Test" };
    (cacheManager.wrap as jest.Mock).mockResolvedValue(mockCompany);

    await companyService.getCompanyById("1");

    expect(cacheManager.wrap).toHaveBeenCalledWith(
      "company-1",
      expect.any(Function),
      {
        revalidate: CacheTTL.STATIC,
        tags: ["company-1-v2"],
      }
    );
  });

  it("revalidateCompaniesPage should call cacheManager.revalidateTag", async () => {
    await companyService.revalidateCompaniesPage("1", "slug");

    expect(cacheManager.revalidateTag).toHaveBeenCalledWith("companies-list");
    expect(cacheManager.revalidateTag).toHaveBeenCalledWith("company-1-v2");
    expect(cacheManager.revalidateTag).toHaveBeenCalledWith("company-slug-slug-v2");
  });
});
