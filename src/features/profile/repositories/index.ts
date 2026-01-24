/**
 * Profile Repositories Barrel Export
 * Re-exports all public APIs to maintain backward compatibility
 */

// Main repository
export { UserRepository, userRepository } from "./user.repository";

// Interfaces
export type {
  CreateUserDTO,
  UpdateUserDTO,
  IUserRepository,
  UserGlobalProblemStats,
} from "../interfaces/user.repository.interface";

// Mappers
export { UserMapper, type UserDocument } from "../mappers/user.mapper";

// Module exports (for advanced usage)
export * from "./user";
export * from "./bookmarks";
export * from "./problem-statuses";
export * from "./education";
export * from "./work-experience";
export * from "./strategies";
export * from "./shared";
