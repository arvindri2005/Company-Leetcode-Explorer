import { companyService } from "@/features/companies/services/company.service";
import { cacheManager } from "@/shared/lib/utils/cache";
import { revalidateCacheTag } from "@/shared/lib/utils/cache/server-cache";
import { CacheTTL } from "@/shared/lib/utils/cache/types";

// Mock dependencies
jest.mock("@/features/companies/repositories/company.repository");
jest.mock("@/shared/lib/utils/cache", () => ({
  cacheManager: {
    wrap: jest.fn(),
  },
  CacheTTL: {
    STATIC: 2592000,
    SHORT: 300,
  },
}));
jest.mock("@/shared/lib/utils/cache/server-cache", () => ({
  revalidateCacheTag: jest.fn(),
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

  it("revalidateCompaniesPage should call revalidateCacheTag", async () => {
    await companyService.revalidateCompaniesPage("1", "slug");

    expect(revalidateCacheTag).toHaveBeenCalledWith("companies-list");
    expect(revalidateCacheTag).toHaveBeenCalledWith("company-1-v2");
    expect(revalidateCacheTag).toHaveBeenCalledWith("company-slug-slug-v2");
  });
});






