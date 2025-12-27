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

export const appEvents = new TypedEventEmitter<AppEventMap>();
