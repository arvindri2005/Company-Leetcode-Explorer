/**
 * @fileoverview Barrel export for profile components
 * Maintains backward compatibility by re-exporting all public components
 */

// Profile page components
export * from "./profile-page";

// Tab components
export * from "./tabs";

// Existing components (maintain backward compatibility)
export { default as EducationExperienceSection } from "./education-experience-section";
export { default as ProfileProblemList } from "./profile-problem-list";
export { default as ProfileTabErrorFallback } from "./profile-tab-error-fallback";
export { default as ProgressStats } from "./progress-stats";
export { default as UserInfoCard } from "./user-info-card";
export { default as WorkExperienceSection } from "./work-experience-section";
