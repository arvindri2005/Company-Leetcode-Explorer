import { companyRepository, GetCompaniesParams, PaginatedCompaniesResponse } from "@/repositories/company.repository";
import { Company } from "@/features/companies/types";
import { Logger } from "@/lib/logger";
import { cacheManager, CacheTTL } from "@/lib/cache";

export class CompanyService {
  async getCompanies(params: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    const { page, pageSize, searchTerm, cursor } = params;

    const cacheKey = `companies-public-${JSON.stringify({
      page,
      pageSize,
      searchTerm,
      cursor,
    })}`;

    return await cacheManager.wrap(
      cacheKey,
      async () => await companyRepository.getCompanies(params),
      {
        revalidate: CacheTTL.STATIC, // 30 days
        tags: ["companies-collection-broad"],
      }
    );
  }

  async loadMoreCompanies(
    currentCursor: string,
    pageSize: number = 9,
    searchTerm?: string,
  ): Promise<{
    companies: Company[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const result = await companyRepository.getCompanies({
        pageSize,
        searchTerm,
        cursor: currentCursor,
    });
    return {
        companies: result.companies,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
    };
  }

  async getCompanyById(id: string, useCache: boolean = true): Promise<Company | undefined> {
    if (!useCache) {
      return await companyRepository.getCompanyById(id);
    }

    try {
      return await cacheManager.wrap(
        `company-${id}`,
        async () => companyRepository.getCompanyById(id),
        {
          revalidate: CacheTTL.STATIC, // 30 days
          tags: [`company-${id}-v2`],
        }
      );
    } catch (error) {
      Logger.error(`Error fetching company by ID ${id}`, error);
      return undefined;
    }
  }

  async getCompanyBySlug(slug: string, useCache: boolean = true): Promise<Company | undefined> {
    if (!useCache) {
      return await companyRepository.getCompanyBySlug(slug);
    }

    try {
      return await cacheManager.wrap(
        `company-slug-${slug}`,
        async () => companyRepository.getCompanyBySlug(slug),
        {
          revalidate: CacheTTL.STATIC, // 30 days
          tags: [`company-slug-${slug}-v2`],
        }
      );
    } catch (error) {
      Logger.error(`Error fetching company by slug ${slug}`, error);
      return undefined;
    }
  }

  async getAllCompanySlugs(useCache: boolean = true): Promise<string[]> {
    if (!useCache) {
        return await companyRepository.getAllCompanySlugs(true);
    }
    
    try {
      return await cacheManager.wrap(
        'all-company-slugs',
        async () => companyRepository.getAllCompanySlugs(true),
        {
            revalidate: CacheTTL.DAILY, // 24 hours
            tags: ['companies-list'],
        }
      );
    } catch (error) {
        Logger.error("Error fetching all company slugs", error);
        return [];
    }
  }

  async addCompany(
    companyData: Omit<
      Company,
      | "id"
      | "slug"
      | "problemCount"
      | "difficultyCounts"
      | "recencyCounts"
      | "commonTags"
      | "statsLastUpdatedAt"
    >,
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }> {
      const result = await companyRepository.addCompany(companyData);
      if (result.id) {
          await this.revalidateCompaniesPage(result.id, result.id);
      }
      return result;
  }

  async updateCompany(
    companyId: string,
    companyData: Partial<Company>,
  ): Promise<{ success: boolean; error?: string }> {
      const result = await companyRepository.updateCompany(companyId, companyData);
      if (result.success) {
          const company = await this.getCompanyById(companyId, false);
          const slug = company?.slug;
          await this.revalidateCompaniesPage(companyId, slug);
      }
      return result;
  }

  async revalidateCompaniesPage(companyId?: string, companySlug?: string) {
    try {
      // Note: We need to use cacheManager.revalidateTag instead of direct revalidateTag import
      // however, revalidateTag takes a single string.
      // The original code was: revalidateTag("companies-list", 'max'); 
      // Note: 'max' is not a valid 2nd arg for revalidateTag in standard Next.js, maybe it was ignored or from a specific version?
      // Standard signature: revalidateTag(tag: string): void
      
      cacheManager.revalidateTag("companies-list");
      
      if (companyId) {
        cacheManager.revalidateTag(`company-${companyId}-v2`);
      }
      
      if (companySlug) {
        cacheManager.revalidateTag(`company-slug-${companySlug}-v2`);
      }
      
      Logger.info("[Cache] Revalidated companies page", { companyId, companySlug });
    } catch (error) {
      Logger.error("Failed to revalidate companies page", error);
    }
  }

  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5,
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>> {
    return await companyRepository.fetchCompanySuggestions(searchTerm, limitNum);
  }
}

export const companyService = new CompanyService();
