/**
 * Dependency Injection Module
 *
 * Exports the DI container and service tokens for use throughout the application.
 */

export { container, Container } from "./container";
export type { Factory, RegisterOptions } from "./container";
export { TOKENS } from "./tokens";
export type { TokenKey } from "./tokens";
