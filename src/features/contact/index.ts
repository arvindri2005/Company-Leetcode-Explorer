/**
 * Contact Feature Public API
 *
 * This barrel export exposes only the public APIs of the contact feature.
 * Internal implementation details are not exported.
 */

// Components
export { ContactForm } from "./components/contact-form";

// Service (singleton instance for direct usage)
export { contactService } from "./services/contact.service";

// Service class (for DI container registration)
export { ContactService } from "./services/contact.service";

// Repository class (for DI container registration)
export { ContactRepository } from "./repositories/contact.repository";

// Interfaces (for type-safe dependency injection)
export type {
  ContactMessageData,
  CreateContactDTO,
  IContactRepository,
  UpdateContactDTO,
} from "./interfaces/contact.repository.interface";
export type { IContactService } from "./interfaces/contact.service.interface";

// Mappers (for data transformation)
export {
  type ContactDocument,
  type ContactDTO,
  ContactMapper,
  type ContactStatus,
} from "./mappers/contact.mapper";
