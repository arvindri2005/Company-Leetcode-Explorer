import { container } from "@/shared/lib/di/container";
import { TOKENS } from "@/shared/lib/di/tokens";

import type { IUserRepository } from "./interfaces/user.repository.interface";
import type { IUserService } from "./interfaces/user.service.interface";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";

export function registerProfileDependencies(): void {
  container.register<IUserRepository>(
    TOKENS.UserRepository,
    () => new UserRepository(),
    { singleton: true }
  );

  container.register<IUserService>(
    TOKENS.UserService,
    () => new UserService(container.resolve<IUserRepository>(TOKENS.UserRepository)),
    { singleton: true }
  );
}
