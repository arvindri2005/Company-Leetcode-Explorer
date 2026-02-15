import { z } from "zod";

/**
 * @description Valid statuses for a user's progress on a problem.
 */
export const VALID_USER_PROBLEM_STATUSES = ["solved", "attempted", "todo", "in_progress", "none"] as const;

/**
 * @description Represents the status of a user's progress on a problem.
 * 'none' indicates no status has been set or it has been cleared.
 */
export type UserProblemStatus = (typeof VALID_USER_PROBLEM_STATUSES)[number];

/**
 * @description Zod schema for user problem status.
 */
export const UserProblemStatusSchema = z.enum(VALID_USER_PROBLEM_STATUSES);

/**
 * @description Type guard to check if a string is a valid UserProblemStatus.
 */
export function isValidUserProblemStatus(status: unknown): status is UserProblemStatus {
  return VALID_USER_PROBLEM_STATUSES.includes(status as UserProblemStatus);
}
