import type { Company as CompanyEntity } from "@/domain/entities/company.entity";
import type { PaginatedResult } from "@/shared/interfaces";
import type { Company } from "@/types";

import type {
  CreateCompanyDTO,
  GetCompaniesParams,
  ICompanyRepository,
  PaginatedCompaniesResponse,
  UpdateCompanyDTO,
} from "../interfaces/company.repository.interface";

import { CompanyCrud } from "./operations/company-crud";
import { PaginationHandler } from "./pagination/pagination-handler";
import { CompanySearch } from "./search/company-search";

export class CompanyRepository implements ICompanyRepository {
  private crudOperations: CompanyCrud;
  private paginationHandler: PaginationHandler;
  private searchOperations: CompanySearch;

  constructor(
    crudOperations?: CompanyCrud,
    paginationHandler?: PaginationHandler,
    searchOperations?: CompanySearch
  ) {
    // Dependency injection with default implementations
    this.crudOperations = crudOperations || new CompanyCrud();
    this.paginationHandler = paginationHandler || new PaginationHandler();
    this.searchOperations = searchOperations || new CompanySearch();
  }

  // ============================================
  // IBaseRepository implementation
  // ============================================

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await this.crudOperations.getCompanyById(id);
    // Note: We return null for interface compliance
    // The actual domain entity conversion would happen in the service layer
    return company ? (company as unknown as CompanyEntity) : null;
  }

  async findAll(params?: { cursor?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<CompanyEntity>> {
    const result = await this.paginationHandler.getCompanies(params);
    return {
      items: result.companies as unknown as CompanyEntity[],
      totalItems: result.totalCompanies,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  }

  async save(data: CreateCompanyDTO): Promise<CompanyEntity> {
    const result = await this.crudOperations.addCompany(data);
    if (!result.id) {
      throw new Error(result.error || "Failed to create company");
    }
    const company = await this.crudOperations.getCompanyById(result.id);
    if (!company) {
      throw new Error("Failed to retrieve created company");
    }
    return company as unknown as CompanyEntity;
  }

  async update(id: string, data: UpdateCompanyDTO): Promise<CompanyEntity> {
    const result = await this.crudOperations.updateCompany(id, data);
    if (!result.success) {
      throw new Error(result.error || "Failed to update company");
    }
    const company = await this.crudOperations.getCompanyById(id);
    if (!company) {
      throw new Error("Failed to retrieve updated company");
    }
    return company as unknown as CompanyEntity;
  }

  async delete(id: string): Promise<void> {
    await this.crudOperations.deleteCompany(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.crudOperations.exists(id);
  }

  // ============================================
  // ICompanyRepository specific methods
  // ============================================

  async getCompanies(params?: GetCompaniesParams): Promise<PaginatedCompaniesResponse> {
    return await this.paginationHandler.getCompanies(params);
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    return await this.crudOperations.getCompanyById(id);
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    return await this.crudOperations.getCompanyBySlug(slug);
  }

  async getAllCompanySlugs(sorted: boolean = true): Promise<string[]> {
    return await this.crudOperations.getAllCompanySlugs(sorted);
  }

  async addCompany(
    companyData: CreateCompanyDTO,
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }> {
    return await this.crudOperations.addCompany(companyData);
  }

  async updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO,
  ): Promise<{ success: boolean; error?: string }> {
    return await this.crudOperations.updateCompany(companyId, companyData);
  }

  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5,
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>> {
    return await this.searchOperations.fetchCompanySuggestions(searchTerm, limitNum);
  }
}

export const companyRepository = new CompanyRepository();
