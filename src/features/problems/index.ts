/**
 * Problems Feature
 *
 * Public API exports for the problems feature.
 * Only export what should be accessible from outside this feature.
 */

// Components - Public UI components
export * from "./components";

// Types - Public type definitions
export * from "./types";

// Interfaces - Service and repository contracts
export * from "./interfaces";

// Constants - Public constants
export * from "./constants";

// Services - Export the service class and singleton instance
export { ProblemService, problemService } from "./services/problem.service";

// Mappers - Export mapper for domain conversions
export type { ProblemDocument } from "./mappers";
export { ProblemMapper } from "./mappers";






