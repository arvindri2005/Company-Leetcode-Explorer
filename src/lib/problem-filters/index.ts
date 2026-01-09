import { problemFilterRegistry } from "./registry";
import { DifficultyFilterImplementation, LastAskedFilterImplementation } from "./implementations";

// Register Core Filters
// This side effect ensures that whenever the registry is imported from this module,
// the default filters are already registered.
problemFilterRegistry.register(new DifficultyFilterImplementation());
problemFilterRegistry.register(new LastAskedFilterImplementation());

export { problemFilterRegistry };
export * from "./types";
