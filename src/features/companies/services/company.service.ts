import { type Company } from "@/features/companies/types";
import { cacheManager, CacheTTL } from "@/lib/utils/cache";
import { revalidateCacheTag } from "@/lib/utils/cache/server-cache";
import { Logger } from "@/lib/utils/logger";
import { failure, type Result, success } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";

import type {
  CreateCompanyDTO,
  GetCompaniesParams,
  ICompanyRepository,
  PaginatedCompaniesResponse,
  UpdateCompanyDTO,
} from "../interfaces/company.repository.interface";
import type {
  ICompanyService,
  LoadMoreCompaniesResponse,
} from "../interfaces/company.service.interface";
import { companyRepository } from "../repositories/company.repository";

export class CompanyService implements ICompanyService {
  constructor(
    private readonly repository: ICompanyRepository = companyRepository
  ) {}

  async getCompanies(
    params: GetCompaniesParams = {}
  ): Promise<Result<PaginatedCompaniesResponse, ServiceError>> {
    try {
      const { page, pageSize, searchTerm, cursor } = params;

      const cacheKey = `companies-public-${JSON.stringify({
        page,
        pageSize,
        searchTerm,
        cursor,
      })}`;

      const result = await cacheManager.wrap(
        cacheKey,
        async () => await this.repository.getCompanies(params),
        {
          revalidate: CacheTTL.STATIC, // 30 days
          tags: ["companies-collection-broad"],
        }
      );

      return success(result);
    } catch (error) {
      Logger.error("Failed to fetch companies", error, { params });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch companies",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async loadMoreCompanies(
    currentCursor: string,
    pageSize: number = 9,
    searchTerm?: string
  ): Promise<Result<LoadMoreCompaniesResponse, ServiceError>> {
    try {
      const result = await this.repository.getCompanies({
        pageSize,
        searchTerm,
        cursor: currentCursor,
      });

      return success({
        companies: result.companies,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      Logger.error("Failed to load more companies", error, { currentCursor, pageSize, searchTerm });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to load more companies",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getCompanyById(
    id: string,
    useCache: boolean = true
  ): Promise<Result<Company, ServiceError>> {
    try {
      if (!useCache) {
        const company = await this.repository.getCompanyById(id);
        if (!company) {
          return failure({
            code: "NOT_FOUND",
            message: `Company not found: ${id}`,
            details: { id },
          });
        }
        return success(company);
      }

      const company = await cacheManager.wrap(
        `company-${id}`,
        async () => this.repository.getCompanyById(id),
        {
          revalidate: CacheTTL.STATIC, // 30 days
          tags: [`company-${id}-v2`],
        }
      );

      if (!company) {
        return failure({
          code: "NOT_FOUND",
          message: `Company not found: ${id}`,
          details: { id },
        });
      }

      return success(company);
    } catch (error) {
      Logger.error(`Error fetching company by ID ${id}`, error);
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch company by ID",
        details: { id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getCompanyBySlug(
    slug: string,
    useCache: boolean = true
  ): Promise<Result<Company, ServiceError>> {
    try {
      if (!useCache) {
        const company = await this.repository.getCompanyBySlug(slug);
        if (!company) {
          return failure({
            code: "NOT_FOUND",
            message: `Company not found: ${slug}`,
            details: { slug },
          });
        }
        return success(company);
      }

      const company = await cacheManager.wrap(
        `company-slug-${slug}`,
        async () => this.repository.getCompanyBySlug(slug),
        {
          revalidate: CacheTTL.STATIC, // 30 days
          tags: [`company-slug-${slug}-v2`],
        }
      );

      if (!company) {
        return failure({
          code: "NOT_FOUND",
          message: `Company not found: ${slug}`,
          details: { slug },
        });
      }

      return success(company);
    } catch (error) {
      Logger.error(`Error fetching company by slug ${slug}`, error);
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch company by slug",
        details: { slug },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getAllCompanySlugs(
    useCache: boolean = true
  ): Promise<Result<string[], ServiceError>> {
    try {
      if (!useCache) {
        const slugs = await this.repository.getAllCompanySlugs(true);
        return success(slugs);
      }

      const slugs = await cacheManager.wrap(
        "all-company-slugs",
        async () => this.repository.getAllCompanySlugs(true),
        {
          revalidate: CacheTTL.DAILY, // 24 hours
          tags: ["companies-list"],
        }
      );

      return success(slugs);
    } catch (error) {
      Logger.error("Error fetching all company slugs", error);
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch company slugs",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async addCompany(
    companyData: CreateCompanyDTO
  ): Promise<Result<{ id: string; alreadyExists?: boolean }, ServiceError>> {
    try {
      const result = await this.repository.addCompany(companyData);

      if (!result.id) {
        return failure({
          code: "VALIDATION_ERROR",
          message: result.error || "Failed to add company",
        });
      }

      if (result.alreadyExists) {
        return success({
          id: result.id,
          alreadyExists: true,
        });
      }

      // Revalidate cache after successful creation
      await this.revalidateCompaniesPage(result.id, result.id);

      return success({ id: result.id });
    } catch (error) {
      Logger.error("Failed to add company", error, { companyName: companyData.name });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to add company",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.updateCompany(companyId, companyData);

      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to update company",
          details: { companyId },
        });
      }

      // Revalidate cache after successful update
      const companyResult = await this.getCompanyById(companyId, false);
      const slug = companyResult.isSuccess ? companyResult.value.slug : undefined;
      await this.revalidateCompaniesPage(companyId, slug);

      return success();
    } catch (error) {
      Logger.error("Failed to update company", error, { companyId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to update company",
        details: { companyId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async revalidateCompaniesPage(
    companyId?: string,
    companySlug?: string
  ): Promise<void> {
    try {
      await revalidateCacheTag("companies-list");

      if (companyId) {
        await revalidateCacheTag(`company-${companyId}-v2`);
      }

      if (companySlug) {
        await revalidateCacheTag(`company-slug-${companySlug}-v2`);
      }

      Logger.info("[Cache] Revalidated companies page", { companyId, companySlug });
    } catch (error) {
      Logger.error("Failed to revalidate companies page", error);
    }
  }

  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5
  ): Promise<Result<Array<Pick<Company, "id" | "name" | "slug" | "logo">>, ServiceError>> {
    try {
      const suggestions = await this.repository.fetchCompanySuggestions(
        searchTerm,
        limitNum
      );
      return success(suggestions);
    } catch (error) {
      Logger.error("Failed to fetch company suggestions", error, { searchTerm });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch company suggestions",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

export const companyService = new CompanyService();
