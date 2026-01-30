import { Logger } from "@/shared/lib/utils/logger";

/**
 * Represents a generic AI flow function.
 * @template TInput The input type for the flow.
 * @template TOutput The output type for the flow.
 */
export type AIFlow<TInput = unknown, TOutput = unknown> = (input: TInput) => Promise<TOutput>;

/**
 * Registry for managing AI flows.
 * Allows decoupling the declaration of flows from their implementation,
 * enabling dynamic registration, overriding, and extension.
 */
class AIFlowRegistry {
  private flows = new Map<string, AIFlow>();

  /**
   * Registers a new AI flow or overrides an existing one.
   * @param name The unique name of the flow.
   * @param flow The implementation of the flow.
   */
  register<TInput, TOutput>(name: string, flow: AIFlow<TInput, TOutput>) {
    if (this.flows.has(name)) {
      Logger.info(`[AIFlowRegistry] Overriding existing flow: ${name}`);
    } else {
      Logger.debug(`[AIFlowRegistry] Registering flow: ${name}`);
    }
    this.flows.set(name, flow as AIFlow<unknown, unknown>);
  }

  /**
   * Retrieves a registered flow.
   * @param name The name of the flow to retrieve.
   * @returns The flow function.
   * @throws Error if the flow is not found.
   */
  get<TInput, TOutput>(name: string): AIFlow<TInput, TOutput> {
    const flow = this.flows.get(name);
    if (!flow) {
      throw new Error(`AI Flow '${name}' not found. Ensure it is registered correctly.`);
    }
    return flow as AIFlow<TInput, TOutput>;
  }

  /**
   * Checks if a flow is registered.
   */
  has(name: string): boolean {
    return this.flows.has(name);
  }
  
  /**
   * Unregisters a flow (useful for cleanup or testing).
   */
  unregister(name: string) {
      this.flows.delete(name);
  }
}

export const aiFlowRegistry = new AIFlowRegistry();






