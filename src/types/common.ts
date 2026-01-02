import { z } from "zod";

/**
 * @description Zod schema for validating URL slugs.
 * Enforces lowercase, alphanumeric characters, and hyphens.
 * Matches: "google", "meta-platforms", "c-plus-plus"
 * Rejects: "Google", "meta_platforms", "c++", "-start", "end-"
 */
export const SlugSchema = z
  .string()
  .min(1, "Slug cannot be empty")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase, alphanumeric, and hyphen-separated (e.g., 'company-name')"
  );

/**
 * @description Type alias for a validated slug string.
 */
export type Slug = z.infer<typeof SlugSchema>;
