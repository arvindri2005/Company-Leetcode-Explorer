/**
 * Problem Mapper
 *
 * Handles conversions between:
 * - Domain entities (Problem)
 * - DTOs (LeetCodeProblem, ProblemSummaryDTO)
 * - Firestore documents
 */

import { Problem } from "@/domain/entities/problem.entity";
import { Difficulty } from "@/domain/value-objects/difficulty.vo";
import { ProblemStatus } from "@/domain/value-objects/problem-status.vo";
import type {
  LeetCodeProblem,
  ProblemSummaryDTO,
  LastAskedPeriod,
} from "../types";

/**
 * Firestore document structure for problems
 */
export interface ProblemDocument {
  id: string;
  title: string;
  description?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  tags: string[];
  normalizedTitle: string;
  acceptanceRate?: number;
  lastAskedPeriod?: LastAskedPeriod;
  companyId: string;
  companySlug: string;
  companyIds?: string[];
  companies?: Record<string, { lastAskedPeriod?: LastAskedPeriod }>;
  problemCompanyName?: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Maps between Problem domain entity and various data representations
 */
export class ProblemMapper {
  /**
   * Convert a Firestore document to a domain Problem entity
   * @param doc - The Firestore document data
   * @returns Problem domain entity
   */
  static toDomain(doc: ProblemDocument): Problem {
    // Map difficulty string to domain value object
    // Note: Domain uses lowercase, DTO uses capitalized
    const difficultyValue = doc.difficulty.toLowerCase();
    const difficulty = Difficulty.create(difficultyValue);

    // Map status - default to "pending" for domain entity
    // The LeetCodeProblem type uses a different status concept (user progress)
    // Domain entity status represents approval workflow
    const status = ProblemStatus.create("approved");

    return Problem.create(
      {
        title: doc.title,
        description: doc.description || "",
        difficulty,
        status,
        companyId: doc.companyId,
        tags: doc.tags || [],
      },
      doc.id
    );
  }

  /**
   * Convert a domain Problem entity to a LeetCodeProblem DTO
   * @param entity - The Problem domain entity
   * @param additionalData - Additional data not stored in domain entity
   * @returns LeetCodeProblem DTO
   */
  static toDTO(
    entity: Problem,
    additionalData?: {
      link?: string;
      companySlug?: string;
      normalizedTitle?: string;
      acceptanceRate?: number;
      lastAskedPeriod?: LastAskedPeriod;
      companyIds?: string[];
      companies?: Record<string, { lastAskedPeriod?: LastAskedPeriod }>;
      problemCompanyName?: string;
      isBookmarked?: boolean;
      currentStatus?: "solved" | "attempted" | "todo" | "none";
    }
  ): LeetCodeProblem {
    // Map domain difficulty (lowercase) to DTO difficulty (capitalized)
    const difficultyValue = entity.difficulty.getValue();
    const capitalizedDifficulty = (difficultyValue.charAt(0).toUpperCase() +
      difficultyValue.slice(1)) as "Easy" | "Medium" | "Hard";

    return {
      id: entity.id,
      title: entity.title,
      difficulty: capitalizedDifficulty,
      link: additionalData?.link || "",
      tags: entity.tags,
      companyId: entity.companyId,
      companySlug: additionalData?.companySlug || "",
      slug: entity.id,
      normalizedTitle: additionalData?.normalizedTitle || entity.title.toLowerCase(),
      acceptanceRate: additionalData?.acceptanceRate,
      lastAskedPeriod: additionalData?.lastAskedPeriod,
      companyIds: additionalData?.companyIds,
      companies: additionalData?.companies,
      problemCompanyName: additionalData?.problemCompanyName,
      isBookmarked: additionalData?.isBookmarked,
      currentStatus: additionalData?.currentStatus,
    };
  }

  /**
   * Convert a domain Problem entity to a summary DTO
   * @param entity - The Problem domain entity
   * @param additionalData - Additional data for the summary
   * @returns ProblemSummaryDTO
   */
  static toSummaryDTO(
    entity: Problem,
    additionalData?: {
      link?: string;
      companySlug?: string;
      normalizedTitle?: string;
      acceptanceRate?: number;
      lastAskedPeriod?: LastAskedPeriod;
      isBookmarked?: boolean;
      currentStatus?: "solved" | "attempted" | "todo" | "none";
    }
  ): ProblemSummaryDTO {
    const difficultyValue = entity.difficulty.getValue();
    const capitalizedDifficulty = (difficultyValue.charAt(0).toUpperCase() +
      difficultyValue.slice(1)) as "Easy" | "Medium" | "Hard";

    return {
      id: entity.id,
      title: entity.title,
      slug: entity.id,
      difficulty: capitalizedDifficulty,
      companyId: entity.companyId,
      companySlug: additionalData?.companySlug || "",
      lastAskedPeriod: additionalData?.lastAskedPeriod,
      tags: entity.tags,
      link: additionalData?.link || "",
      normalizedTitle: additionalData?.normalizedTitle || entity.title.toLowerCase(),
      acceptanceRate: additionalData?.acceptanceRate,
      isBookmarked: additionalData?.isBookmarked,
      currentStatus: additionalData?.currentStatus,
    };
  }

  /**
   * Convert a domain Problem entity to a Firestore document
   * @param entity - The Problem domain entity
   * @param additionalData - Additional data for the document
   * @returns Firestore document data (without id)
   */
  static toDocument(
    entity: Problem,
    additionalData?: {
      link?: string;
      companySlug?: string;
      normalizedTitle?: string;
      acceptanceRate?: number;
      lastAskedPeriod?: LastAskedPeriod;
      companyIds?: string[];
      companies?: Record<string, { lastAskedPeriod?: LastAskedPeriod }>;
      problemCompanyName?: string;
    }
  ): Omit<ProblemDocument, "id"> {
    const difficultyValue = entity.difficulty.getValue();
    const capitalizedDifficulty = (difficultyValue.charAt(0).toUpperCase() +
      difficultyValue.slice(1)) as "Easy" | "Medium" | "Hard";

    return {
      title: entity.title,
      description: entity.description,
      difficulty: capitalizedDifficulty,
      link: additionalData?.link || "",
      tags: entity.tags,
      normalizedTitle: additionalData?.normalizedTitle || entity.title.toLowerCase(),
      acceptanceRate: additionalData?.acceptanceRate,
      lastAskedPeriod: additionalData?.lastAskedPeriod,
      companyId: entity.companyId,
      companySlug: additionalData?.companySlug || "",
      companyIds: additionalData?.companyIds,
      companies: additionalData?.companies,
      problemCompanyName: additionalData?.problemCompanyName,
      slug: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert a LeetCodeProblem DTO to a domain Problem entity
   * Useful when receiving data from external sources
   * @param dto - The LeetCodeProblem DTO
   * @returns Problem domain entity
   */
  static fromDTO(dto: LeetCodeProblem): Problem {
    const difficultyValue = dto.difficulty.toLowerCase();
    const difficulty = Difficulty.create(difficultyValue);
    const status = ProblemStatus.create("approved");

    return Problem.create(
      {
        title: dto.title,
        description: "",
        difficulty,
        status,
        companyId: dto.companyId,
        tags: dto.tags || [],
      },
      dto.id
    );
  }
}
