import { container } from "@/lib/di/container";
import { TOKENS } from "@/lib/di/tokens";

import type { IContactRepository } from "./interfaces/contact.repository.interface";
import type { IContactService } from "./interfaces/contact.service.interface";
import { ContactRepository } from "./repositories/contact.repository";
import { ContactService } from "./services/contact.service";

export function registerContactDependencies(): void {
  container.register<IContactRepository>(
    TOKENS.ContactRepository,
    () => new ContactRepository() as IContactRepository,
    { singleton: true }
  );

  container.register<IContactService>(
    TOKENS.ContactService,
    () => new ContactService(container.resolve<IContactRepository>(TOKENS.ContactRepository)),
    { singleton: true }
  );
}
