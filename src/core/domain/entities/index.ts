/**
 * Domain Entities
 * Contains business entities that encapsulate core business rules
 */

export { Entity } from "./base.entity";
export { Company } from "./company.entity";
export { Contact } from "./contact.entity";
export { Problem } from "./problem.entity";
export * from "./strategy.entity"; // Export strategy entity
export { User } from "./user.entity";
export * from "./user.entity"; // Export the non-default exports (like types and schemas)