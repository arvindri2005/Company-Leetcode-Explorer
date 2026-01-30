import { container } from "@/shared/lib/di/container";
import { TOKENS } from "@/shared/lib/di/tokens";

import type { ICompanyRepository } from "./interfaces/company.repository.interface";
import type { ICompanyService } from "./interfaces/company.service.interface";
import { CompanyRepository } from "./repositories/company.repository";
import { CompanyService } from "./services/company.service";

export function registerCompanyDependencies(): void {
  container.register<ICompanyRepository>(
    TOKENS.CompanyRepository,
    () => new CompanyRepository(),
    { singleton: true }
  );

  container.register<ICompanyService>(
    TOKENS.CompanyService,
    () => new CompanyService(container.resolve<ICompanyRepository>(TOKENS.CompanyRepository)),
    { singleton: true }
  );
}
