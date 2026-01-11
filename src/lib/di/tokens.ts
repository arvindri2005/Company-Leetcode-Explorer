/**
 * Dependency Injection Tokens
 *
 * Unique symbols used to identify services and repositories
 * in the DI container. Using symbols ensures type-safe resolution
 * and prevents naming collisions.
 */

export const TOKENS = {
  // Services
  ProblemService: Symbol("ProblemService"),
  CompanyService: Symbol("CompanyService"),
  UserService: Symbol("UserService"),
  ContactService: Symbol("ContactService"),

  // Repositories
  ProblemRepository: Symbol("ProblemRepository"),
  CompanyRepository: Symbol("CompanyRepository"),
  UserRepository: Symbol("UserRepository"),
  ContactRepository: Symbol("ContactRepository"),
} as const;

// Type for token keys
export type TokenKey = keyof typeof TOKENS;
