import { container } from "@/lib/di/container";
import { TOKENS } from "@/lib/di/tokens";

import type { IProblemRepository } from "./interfaces/problem.repository.interface";
import type { IProblemService } from "./interfaces/problem.service.interface";
import { ProblemRepository } from "./repositories/problem.repository";
import { ProblemService } from "./services/problem.service";

export function registerProblemDependencies(): void {
  container.register<IProblemRepository>(
    TOKENS.ProblemRepository,
    () => new ProblemRepository(),
    { singleton: true }
  );

  container.register<IProblemService>(
    TOKENS.ProblemService,
    () => new ProblemService(container.resolve<IProblemRepository>(TOKENS.ProblemRepository)),
    { singleton: true }
  );
}
