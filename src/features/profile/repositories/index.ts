/**
 * Profile Repositories Barrel Export
 * Re-exports all public APIs to maintain backward compatibility
 */

// Main repository
export { UserRepository, userRepository } from "./user.repository";

// Interfaces
export type {
  CreateUserDTO,
  IUserRepository,
  UpdateUserDTO,
  UserGlobalProblemStats,
} from "../interfaces/user.repository.interface";

// Mappers
export { type UserDocument,UserMapper } from "../mappers/user.mapper";

// Module exports (for advanced usage)
export * from "./bookmarks";
export * from "./education";
export * from "./problem-statuses";
export * from "./shared";
export * from "./strategies";
export * from "./user";
export * from "./work-experience";
