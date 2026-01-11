/**
 * Profile Feature Public API
 *
 * This barrel export exposes only the public APIs of the profile feature.
 * Internal implementation details are not exported.
 */

// Components
export { default as UserInfoCard } from "./components/user-info-card";
export { default as EducationExperienceSection } from "./components/education-experience-section";
export { default as WorkExperienceSection } from "./components/work-experience-section";
export { default as ProgressStats } from "./components/progress-stats";
export { default as ProfileProblemList } from "./components/profile-problem-list";
export { default as ProfileTabErrorFallback } from "./components/profile-tab-error-fallback";
export { default as StrategyListsSection } from "./components/strategy-lists-section";

// Service (singleton instance for direct usage)
export { userService } from "./services/user.service";

// Service class (for DI container registration)
export { UserService } from "./services/user.service";

// Repository class (for DI container registration)
export { UserRepository } from "./repositories/user.repository";

// Interfaces (for type-safe dependency injection)
export type { IUserService } from "./interfaces/user.service.interface";
export type {
  IUserRepository,
  UserGlobalProblemStats,
  CreateUserDTO,
  UpdateUserDTO,
} from "./interfaces/user.repository.interface";

// Mappers (for data transformation)
export { UserMapper, type UserDocument } from "./mappers/user.mapper";
