// Export all types from domain-specific files
// This file serves as a barrel file to maintain backward compatibility
// and provide a centralized import point if preferred.

export * from "./common";
// Re-export problem types from feature
export * from "../features/problems/types";
// Re-export company types from feature
export * from "../features/companies/types";
export * from "./user";
export * from "./ai";
export * from "./job-application";
export * from "./ui";






