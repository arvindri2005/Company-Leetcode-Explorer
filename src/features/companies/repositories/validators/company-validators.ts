/**
 * Company Validators Module
 * Handles input validation for company operations
 */

import { CompanySchema } from "@/types";

import type {
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../../interfaces/company.repository.interface";

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate company creation data
 * @param companyData - Data for creating a company
 * @returns Validation result with sanitized data or error
 */
export function validateCreateCompany(
  companyData: CreateCompanyDTO
): ValidationResult<CreateCompanyDTO> {
  // Check for required name field
  if (!companyData.name?.trim()) {
    return {
      success: false,
      error: "Company name is required",
    };
  }

  // Pre-validate input using Zod (partial schema since some fields are auto-generated)
  const PartialCompanySchema = CompanySchema.pick({
    name: true,
    logo: true,
    description: true,
    website: true,
    relatedCompanies: true,
  });

  const validation = PartialCompanySchema.safeParse(companyData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}

/**
 * Validate company update data
 * @param companyData - Data for updating a company
 * @returns Validation result with sanitized data or error
 */
export function validateUpdateCompany(
  companyData: UpdateCompanyDTO
): ValidationResult<UpdateCompanyDTO> {
  // Validate input using Zod (partial schema)
  // This protects against invalid data types and malicious inputs (e.g. javascript: URLs)
  const validation = CompanySchema.partial().safeParse(companyData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}

/**
 * Sanitize update data by removing fields that shouldn't be updated directly
 * @param updates - Update data to sanitize
 * @returns Sanitized update data
 */
export function sanitizeUpdateData(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...updates };

  // Remove fields that shouldn't be updated directly
  delete sanitized.id;
  delete sanitized.slug;
  delete sanitized.normalizedName;

  // Update normalizedName if name is being updated
  if (sanitized.name && typeof sanitized.name === "string") {
    sanitized.normalizedName = sanitized.name.toLowerCase().trim();
  }

  // Security: Prevent Mass Assignment of computed/readonly fields
  // These fields should only be updated by the system (e.g., ProblemRepository)
  delete sanitized.problemCount;
  delete sanitized.difficultyCounts;
  delete sanitized.recencyCounts;
  delete sanitized.commonTags;
  delete sanitized.statsLastUpdatedAt;

  // Remove undefined values
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  return sanitized;
}
