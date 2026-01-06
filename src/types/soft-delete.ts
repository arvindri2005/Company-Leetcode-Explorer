import { z } from "zod";

/**
 * @description Mixin schema for soft-deletable entities.
 */
export const SoftDeletableSchema = z.object({
  isDeleted: z.boolean().optional().default(false),
  deletedAt: z.date().optional(), // Firestore Timestamp converted to Date
});

/**
 * @description Type for soft-deletable entities.
 */
export type SoftDeletable = z.infer<typeof SoftDeletableSchema>;
