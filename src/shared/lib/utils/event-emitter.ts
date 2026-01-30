import { Logger } from "@/shared/lib/utils/logger";

/**
 * A generic typed event emitter.
 * Implements the Observer pattern to allow easier extensibility.
 * See `guide/advanced-patterns.md` for architectural details.
 *
 * M is a map of EventKey -> Payload
 */
export class TypedEventEmitter<M extends Record<string, unknown>> {
  private listeners: Map<keyof M, Set<(payload: M[keyof M]) => void | Promise<void>>> = new Map();

  /**
   * Subscribe to an event.
   * @returns A function to unsubscribe.
   */
  subscribe<K extends keyof M>(
    event: K,
    handler: (payload: M[K]) => void | Promise<void>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (payload: M[keyof M]) => void | Promise<void>);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<K extends keyof M>(event: K, handler: (payload: M[K]) => void | Promise<void>) {
    this.listeners.get(event)?.delete(handler as (payload: M[keyof M]) => void | Promise<void>);
  }

  /**
   * Emit an event to all subscribers.
   * Catches errors in listeners to prevent crashing the core flow.
   * Awaits all listeners to ensure completion before returning (crucial for Serverless).
   */
  async emit<K extends keyof M>(event: K, payload: M[K]) {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {return;}

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        Logger.error(`Error in event listener for ${String(event)}`, error);
      }
    });

    await Promise.all(promises);
  }
  
  /**
   * Clear all listeners (useful for testing)
   */
  clear() {
      this.listeners.clear();
  }
}






