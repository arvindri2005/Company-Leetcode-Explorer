/**
 * Dependency Injection Module
 *
 * Exports the DI container and service tokens for use throughout the application.
 */

export type { Factory, RegisterOptions } from "./container";
export { Container,container } from "./container";
export type { TokenKey } from "./tokens";
export { TOKENS } from "./tokens";