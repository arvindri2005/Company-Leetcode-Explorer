/**
 * Company Mapper
 *
 * Handles conversions between:
 * - Domain entities (Company)
 * - DTOs (Company type from features/companies/types)
 * - Firestore documents
 */

import { Company as CompanyEntity } from "@/domain/entities/company.entity";
import { CompanySize } from "@/domain/value-objects/company-size.vo";

import type { Company } from "../types";

/**
 * Firestore document structure for companies
 */
export interface CompanyDocument {
  id: string;
  name: string;
  normalizedName?: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  problemCount?: number;
  difficultyCounts?: { Easy: number; Medium: number; Hard: number };
  recencyCounts?: {
    last_30_days: number;
    within_3_months: number;
    within_6_months: number;
    older_than_6_months: number;
  };
  commonTags?: Array<{ tag: string; count: number }>;
  relatedCompanies?: string[];
  statsLastUpdatedAt?: Date;
}

/**
 * Maps between Company domain entity and various data representations
 */
export class CompanyMapper {
  /**
   * Convert a Firestore document to a domain Company entity
   * @param doc - The Firestore document data
   * @returns Company domain entity
   */
  static toDomain(doc: CompanyDocument): CompanyEntity {
    // Default to "startup" size since the DTO doesn't have size info
    // This can be enhanced when size data is available
    const size = CompanySize.create("startup");

    return CompanyEntity.create(
      {
        name: doc.name,
        slug: doc.slug,
        size,
        industry: "", // Not available in current DTO
        description: doc.description || "",
        website: doc.website,
        logoUrl: doc.logo,
      },
      doc.id
    );
  }

  /**
   * Convert a domain Company entity to a Company DTO
   * @param entity - The Company domain entity
   * @param additionalData - Additional data not stored in domain entity
   * @returns Company DTO
   */
  static toDTO(
    entity: CompanyEntity,
    additionalData?: {
      normalizedName?: string;
      problemCount?: number;
      difficultyCounts?: { Easy: number; Medium: number; Hard: number };
      recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
      };
      commonTags?: Array<{ tag: string; count: number }>;
      relatedCompanies?: string[];
      statsLastUpdatedAt?: Date;
    }
  ): Company {
    return {
      id: entity.id,
      name: entity.name,
      normalizedName: additionalData?.normalizedName || entity.name.toLowerCase(),
      slug: entity.slug,
      logo: entity.logoUrl,
      description: entity.description,
      website: entity.website,
      problemCount: additionalData?.problemCount,
      difficultyCounts: additionalData?.difficultyCounts,
      recencyCounts: additionalData?.recencyCounts,
      commonTags: additionalData?.commonTags,
      relatedCompanies: additionalData?.relatedCompanies,
      statsLastUpdatedAt: additionalData?.statsLastUpdatedAt,
    };
  }

  /**
   * Convert a domain Company entity to a Firestore document
   * @param entity - The Company domain entity
   * @param additionalData - Additional data for the document
   * @returns Firestore document data (without id)
   */
  static toDocument(
    entity: CompanyEntity,
    additionalData?: {
      normalizedName?: string;
      problemCount?: number;
      difficultyCounts?: { Easy: number; Medium: number; Hard: number };
      recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
      };
      commonTags?: Array<{ tag: string; count: number }>;
      relatedCompanies?: string[];
      statsLastUpdatedAt?: Date;
    }
  ): Omit<CompanyDocument, "id"> {
    return {
      name: entity.name,
      normalizedName: additionalData?.normalizedName || entity.name.toLowerCase(),
      slug: entity.slug,
      logo: entity.logoUrl,
      description: entity.description,
      website: entity.website,
      problemCount: additionalData?.problemCount,
      difficultyCounts: additionalData?.difficultyCounts,
      recencyCounts: additionalData?.recencyCounts,
      commonTags: additionalData?.commonTags,
      relatedCompanies: additionalData?.relatedCompanies,
      statsLastUpdatedAt: additionalData?.statsLastUpdatedAt,
    };
  }

  /**
   * Convert a Company DTO to a domain Company entity
   * Useful when receiving data from external sources
   * @param dto - The Company DTO
   * @returns Company domain entity
   */
  static fromDTO(dto: Company): CompanyEntity {
    // Default to "startup" size since the DTO doesn't have size info
    const size = CompanySize.create("startup");

    return CompanyEntity.create(
      {
        name: dto.name,
        slug: dto.slug,
        size,
        industry: "", // Not available in current DTO
        description: dto.description || "",
        website: dto.website,
        logoUrl: dto.logo,
      },
      dto.id
    );
  }

  /**
   * Convert a Firestore document to a Company DTO
   * Direct conversion without going through domain entity
   * @param doc - The Firestore document data
   * @returns Company DTO
   */
  static documentToDTO(doc: CompanyDocument): Company {
    return {
      id: doc.id,
      name: doc.name,
      normalizedName: doc.normalizedName,
      slug: doc.slug,
      logo: doc.logo,
      description: doc.description,
      website: doc.website,
      problemCount: doc.problemCount,
      difficultyCounts: doc.difficultyCounts,
      recencyCounts: doc.recencyCounts,
      commonTags: doc.commonTags,
      relatedCompanies: doc.relatedCompanies,
      statsLastUpdatedAt: doc.statsLastUpdatedAt,
    };
  }
}
