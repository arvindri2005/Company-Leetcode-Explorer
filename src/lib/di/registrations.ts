/**
 * DI Container Registrations
 *
 * This file registers all services and repositories with the DI container.
 * Import this file in your application entry point to initialize the container.
 */

import type { ICompanyRepository } from "@/features/companies/interfaces/company.repository.interface";
import type { ICompanyService } from "@/features/companies/interfaces/company.service.interface";
import { CompanyRepository } from "@/features/companies/repositories/company.repository";
import { CompanyService } from "@/features/companies/services/company.service";
import type { IContactRepository } from "@/features/contact/interfaces/contact.repository.interface";
import type { IContactService } from "@/features/contact/interfaces/contact.service.interface";
import { ContactRepository } from "@/features/contact/repositories/contact.repository";
import { ContactService } from "@/features/contact/services/contact.service";
import type { IProblemRepository } from "@/features/problems/interfaces/problem.repository.interface";
// Import interfaces for type safety
import type { IProblemService } from "@/features/problems/interfaces/problem.service.interface";
import { ProblemRepository } from "@/features/problems/repositories/problem.repository";
// Import service and repository implementations
import { ProblemService } from "@/features/problems/services/problem.service";
import type { IUserRepository } from "@/features/profile/interfaces/user.repository.interface";
import type { IUserService } from "@/features/profile/interfaces/user.service.interface";
import { UserRepository } from "@/features/profile/repositories/user.repository";
import { UserService } from "@/features/profile/services/user.service";

import { container } from "./container";
import { TOKENS } from "./tokens";

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

  container.register<IUserRepository>(
    TOKENS.UserRepository,
    () => new UserRepository(),
    { singleton: true }
  );

  container.register<IContactRepository>(
    TOKENS.ContactRepository,
    () => new ContactRepository() as IContactRepository,
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

  container.register<IUserService>(
    TOKENS.UserService,
    () => new UserService(container.resolve<IUserRepository>(TOKENS.UserRepository)),
    { singleton: true }
  );

  container.register<IContactService>(
    TOKENS.ContactService,
    () => new ContactService(container.resolve<IContactRepository>(TOKENS.ContactRepository)),
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

/**
 * Get the user service from the DI container
 */
export function getUserService(): IUserService {
  return container.resolve<IUserService>(TOKENS.UserService);
}

/**
 * Get the user repository from the DI container
 */
export function getUserRepository(): IUserRepository {
  return container.resolve<IUserRepository>(TOKENS.UserRepository);
}

/**
 * Get the contact service from the DI container
 */
export function getContactService(): IContactService {
  return container.resolve<IContactService>(TOKENS.ContactService);
}

/**
 * Get the contact repository from the DI container
 */
export function getContactRepository(): IContactRepository {
  return container.resolve<IContactRepository>(TOKENS.ContactRepository);
}
