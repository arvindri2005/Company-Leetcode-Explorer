/**
 * Company Repositories Module
 * Barrel export for backward compatibility
 * Re-exports all public APIs from company repository and its modules
 */

// Main repository
export { CompanyRepository, companyRepository } from './company.repository';

// CRUD operations
export type { CompanyCrudOperations } from './operations/company-crud';
export { CompanyCrud, mapFirestoreDocToCompany } from './operations/company-crud';

// Search operations
export type { CompanySearchOperations } from './search/company-search';
export { CompanySearch } from './search/company-search';

// Pagination
export type { CursorData } from './pagination/cursor-manager';
export { decodeCursor,encodeCursor } from './pagination/cursor-manager';
export type { CompanyPaginationHandler } from './pagination/pagination-handler';
export { PaginationHandler } from './pagination/pagination-handler';

// Validators
export type { ValidationResult } from './validators/company-validators';
export {
  sanitizeUpdateData,
  validateCreateCompany,
  validateUpdateCompany,
} from './validators/company-validators';
