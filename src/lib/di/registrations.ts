/**
 * DI Container Registrations
 *
 * This file registers all services and repositories with the DI container.
 * Import this file in your application entry point to initialize the container.
 */

import { container } from "./container";
import { TOKENS } from "./tokens";

// Import service and repository implementations
import { ProblemService } from "@/features/problems/services/problem.service";
import { ProblemRepository } from "@/features/problems/repositories/problem.repository";
import { CompanyService } from "@/features/companies/services/company.service";
import { CompanyRepository } from "@/features/companies/repositories/company.repository";

// Import interfaces for type safety
import type { IProblemService } from "@/features/problems/interfaces/problem.service.interface";
import type { IProblemRepository } from "@/features/problems/interfaces/problem.repository.interface";
import type { ICompanyService } from "@/features/companies/interfaces/company.service.interface";
import type { ICompanyRepository } from "@/features/companies/interfaces/company.repository.interface";

/**
 * Register all services and repositories with the DI container
 * Call this function once at application startup
 */
export function registerDependencies(): void {
  // Register repositories (singletons for connection reuse)
  container.register<IProblemRepository>(
    TOKENS.ProblemRepository,
    () => new ProblemRepository(),
    { singleton: true }
  );

  container.register<ICompanyRepository>(
    TOKENS.CompanyRepository,
    () => new CompanyRepository(),
    { singleton: true }
  );

  // Register services (singletons for caching benefits)
  container.register<IProblemService>(
    TOKENS.ProblemService,
    () => new ProblemService(container.resolve<IProblemRepository>(TOKENS.ProblemRepository)),
    { singleton: true }
  );

  container.register<ICompanyService>(
    TOKENS.CompanyService,
    () => new CompanyService(container.resolve<ICompanyRepository>(TOKENS.CompanyRepository)),
    { singleton: true }
  );
}

/**
 * Get the problem service from the DI container
 */
export function getProblemService(): IProblemService {
  return container.resolve<IProblemService>(TOKENS.ProblemService);
}

/**
 * Get the problem repository from the DI container
 */
export function getProblemRepository(): IProblemRepository {
  return container.resolve<IProblemRepository>(TOKENS.ProblemRepository);
}

/**
 * Get the company service from the DI container
 */
export function getCompanyService(): ICompanyService {
  return container.resolve<ICompanyService>(TOKENS.CompanyService);
}

/**
 * Get the company repository from the DI container
 */
export function getCompanyRepository(): ICompanyRepository {
  return container.resolve<ICompanyRepository>(TOKENS.CompanyRepository);
}
