/**
 * DI Container Registrations
 *
 * This file registers all services and repositories with the DI container.
 * Import this file in your application entry point to initialize the container.
 */

import { registerCompanyDependencies } from "@/features/companies/di";
import type { ICompanyRepository } from "@/features/companies/interfaces/company.repository.interface";
import type { ICompanyService } from "@/features/companies/interfaces/company.service.interface";
import { registerContactDependencies } from "@/features/contact/di";
import type { IContactRepository } from "@/features/contact/interfaces/contact.repository.interface";
import type { IContactService } from "@/features/contact/interfaces/contact.service.interface";
import { registerProblemDependencies } from "@/features/problems/di";
import type { IProblemRepository } from "@/features/problems/interfaces/problem.repository.interface";
// Import interfaces for type safety
import type { IProblemService } from "@/features/problems/interfaces/problem.service.interface";
import { registerProfileDependencies } from "@/features/profile/di";
import type { IUserRepository } from "@/features/profile/interfaces/user.repository.interface";
import type { IUserService } from "@/features/profile/interfaces/user.service.interface";
import { container } from "@/shared/lib/di/container";
import { TOKENS } from "@/shared/lib/di/tokens";

/**
 * Register all services and repositories with the DI container
 * Call this function once at application startup
 */
export function registerDependencies(): void {
  registerProblemDependencies();
  registerCompanyDependencies();
  registerProfileDependencies();
  registerContactDependencies();
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
