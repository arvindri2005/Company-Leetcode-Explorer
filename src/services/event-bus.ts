import { ProblemStatus } from "@/types";
import { TypedEventEmitter } from "@/lib/event-emitter";

export interface AppEventMap {
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

export type AppEventKey = keyof AppEventMap;

export type AppEventHandler<K extends AppEventKey> = (
  payload: AppEventMap[K],
) => void | Promise<void>;

/**
 * Global Event Bus instance.
 * Use this to emit and subscribe to application-wide events.
 * See `guide/advanced-patterns.md` for usage examples.
 */
export const appEvents = new TypedEventEmitter<AppEventMap>();
