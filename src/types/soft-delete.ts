import { z } from "zod";

/**
 * @description Mixin schema for soft-deletable entities.
 */
export const SoftDeletableSchema = z.object({
  isDeleted: z.boolean().optional(),
  deletedAt: z.date().optional(),
});

/**
 * @description Interface for soft-deletable entities.
 */
export type SoftDeletable = z.infer<typeof SoftDeletableSchema>;
