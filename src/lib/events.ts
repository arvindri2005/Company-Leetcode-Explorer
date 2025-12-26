import { Logger } from "@/lib/logger";
import { ProblemStatus } from "@/types";

export interface EventMap {
  "user:problem_status_changed": {
    userId: string;
    problemId: string;
    status: ProblemStatus;
    companySlug: string;
    problemSlug: string;
    timestamp: Date;
  };
  "user:bookmark_toggled": {
    userId: string;
    problemId: string;
    isBookmarked: boolean;
    companySlug: string;
    problemSlug: string;
    timestamp: Date;
  };
}

export type EventKey = keyof EventMap;

export type EventHandler<K extends EventKey> = (
  payload: EventMap[K],
) => void | Promise<void>;

/**
 * A typed event emitter for decoupling side effects from core actions.
 * Implements the Observer pattern to allow easier extensibility.
 */
export class AppEventEmitter {
  private listeners: Map<EventKey, Set<EventHandler<any>>> = new Map();

  /**
   * Subscribe to an event.
   * @returns A function to unsubscribe.
   */
  subscribe<K extends EventKey>(
    event: K,
    handler: EventHandler<K>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<K extends EventKey>(event: K, handler: EventHandler<K>) {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers.
   * Catches errors in listeners to prevent crashing the core flow.
   * Awaits all listeners to ensure completion before returning (crucial for Serverless).
   */
  async emit<K extends EventKey>(event: K, payload: EventMap[K]) {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        Logger.error(`Error in event listener for ${event}`, error);
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

export const appEvents = new AppEventEmitter();
