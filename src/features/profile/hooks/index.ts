/**
 * @fileoverview Barrel export for profile hooks
 * Maintains backward compatibility by re-exporting all public hooks
 */

export { useBookmarks } from "./use-bookmarks";
export { useEducation } from "./use-education";
export { useProblemStatuses } from "./use-problem-statuses";
export { useProfileData } from "./use-profile-data";
export { useStrategies } from "./use-strategies";
export { useWorkExperience } from "./use-work-experience";

// Export types
export type { BookmarksData } from "./use-bookmarks";
export type { EducationData } from "./use-education";
export type { ProblemStatusesData } from "./use-problem-statuses";
export type { ProfileData } from "./use-profile-data";
export type { StrategiesData } from "./use-strategies";
export type { WorkExperienceData } from "./use-work-experience";
