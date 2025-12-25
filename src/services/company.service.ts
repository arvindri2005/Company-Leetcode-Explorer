import { companyRepository, GetCompaniesParams, PaginatedCompaniesResponse } from "@/repositories/company.repository";
import { Company } from "@/types";
import { unstable_cache, revalidateTag } from "next/cache";

export class CompanyService {
  async getCompanies(params: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    const { page, pageSize, searchTerm, cursor } = params;

    const cacheKey = `companies-public-${JSON.stringify({
      page,
      pageSize,
      searchTerm,
      cursor,
    })}`;

    const getCachedCompanies = unstable_cache(
      async () => await companyRepository.getCompanies(params),
      [cacheKey],
      {
        revalidate: 2592000, // 30 days
        tags: ["companies-collection-broad"],
      }
    );

    return await getCachedCompanies();
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

    const getCachedCompany = unstable_cache(
      async () => companyRepository.getCompanyById(id),
      [`company-${id}`],
      {
        revalidate: 2592000, // 30 days
        tags: [`company-${id}-v2`],
      }
    );

    try {
      return await getCachedCompany();
    } catch (error) {
      console.error(`Error fetching company by ID ${id}:`, error);
      return undefined;
    }
  }

  async getCompanyBySlug(slug: string, useCache: boolean = true): Promise<Company | undefined> {
    if (!useCache) {
      return await companyRepository.getCompanyBySlug(slug);
    }

    const getCachedCompany = unstable_cache(
      async () => companyRepository.getCompanyBySlug(slug),
      [`company-slug-${slug}`],
      {
        revalidate: 2592000, // 30 days
        tags: [`company-slug-${slug}-v2`],
      }
    );

    try {
      return await getCachedCompany();
    } catch (error) {
      console.error(`Error fetching company by slug ${slug}:`, error);
      return undefined;
    }
  }

  async getAllCompanySlugs(useCache: boolean = true): Promise<string[]> {
    if (!useCache) {
        return await companyRepository.getAllCompanySlugs(true);
    }
    // We can use a simple cache variable like in the original code, or use unstable_cache?
    // Original used a module-level variable. 
    // unstable_cache is better for serverless/consistent caching.
    
    const getCachedSlugs = unstable_cache(
        async () => companyRepository.getAllCompanySlugs(true),
        ['all-company-slugs'],
        {
            revalidate: 86400, // 24 hours
            tags: ['companies-list'],
        }
    );

    try {
        return await getCachedSlugs();
    } catch (error) {
        console.error("Error fetching all company slugs:", error);
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
          // Invalidate caches
          // We don't have the slug easily available if we only have result.id (which is the slug actually in repo)
          // Repo returns { id: companySlug }.
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
          // We need slug for proper invalidation.
          const company = await this.getCompanyById(companyId, false); // Get fresh
          const slug = company?.slug;
          await this.revalidateCompaniesPage(companyId, slug);
      }
      return result;
  }

  async bulkDeleteCompanies(
    companyIds: string[],
  ): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
      const result = await companyRepository.bulkDeleteCompanies(companyIds);
      if (result.success) {
          await this.revalidateCompaniesPage();
          for (const id of companyIds) {
              revalidateTag(`company-${id}-v2`, 'max');
          }
      }
      return result;
  }

  async deleteCompany(
    companyId: string,
  ): Promise<{ success: boolean; error?: string }> {
      const result = await companyRepository.deleteCompany(companyId);
      if (result.success) {
          await this.revalidateCompaniesPage(companyId);
      }
      return result;
  }

  async restoreCompany(
    companyId: string,
  ): Promise<{ success: boolean; error?: string }> {
      const result = await companyRepository.restoreCompany(companyId);
      if (result.success) {
          await this.revalidateCompaniesPage(companyId);
      }
      return result;
  }

  async revalidateCompaniesPage(companyId?: string, companySlug?: string) {
    try {
      revalidateTag("companies-list", 'max');
      
      if (companyId) {
        revalidateTag(`company-${companyId}-v2`, 'max');
      }
      
      if (companySlug) {
        revalidateTag(`company-slug-${companySlug}-v2`, 'max');
      }
      
      console.log(`[Cache] Revalidated companies page. Id: ${companyId}, Slug: ${companySlug}`);
    } catch (error) {
      console.error("Failed to revalidate companies page:", error);
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
