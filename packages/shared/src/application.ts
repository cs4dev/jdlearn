import { z } from "zod";
import { GenerationBundle } from "./bundle";

// A persisted generation (SPEC §3).
export const Application = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  jdText: z.string().min(1),
  bundle: GenerationBundle,
  createdAt: z.string(), // ISO 8601
  deletedAt: z.string().nullish(), // ISO 8601 when soft-deleted; absent/null otherwise
});
export type Application = z.infer<typeof Application>;
