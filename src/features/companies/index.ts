/**
 * Companies Feature
 * Public API exports for the companies feature module
 */

// Services
export { CompanyService,companyService } from "./services/company.service";

// Interfaces (for dependency injection and type safety)
export type {
  CreateCompanyDTO,
  GetCompaniesParams,
  ICompanyRepository,
  PaginatedCompaniesResponse,
  UpdateCompanyDTO,
} from "./interfaces/company.repository.interface";
export type {
  ICompanyService,
  LoadMoreCompaniesResponse,
} from "./interfaces/company.service.interface";

// Types
export * from "./types";

// Components
export * from "./components";

// Hooks
export * from "./hooks";

// Mappers
export { type CompanyDocument,CompanyMapper } from "./mappers";
