/**
 * Companies Feature
 * Public API exports for the companies feature module
 */

// Services
export { companyService, CompanyService } from "./services/company.service";

// Interfaces (for dependency injection and type safety)
export type {
  ICompanyService,
  LoadMoreCompaniesResponse,
} from "./interfaces/company.service.interface";

export type {
  ICompanyRepository,
  GetCompaniesParams,
  PaginatedCompaniesResponse,
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "./interfaces/company.repository.interface";

// Types
export * from "./types";

// Components
export * from "./components";

// Hooks
export * from "./hooks";

// Mappers
export { CompanyMapper, type CompanyDocument } from "./mappers";
