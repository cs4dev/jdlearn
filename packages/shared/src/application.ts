import { z } from "zod";
import { GenerationBundle } from "./bundle";

// Lifecycle of a generation job (SPEC §3, v10). The application row IS the job.
export const ApplicationStatus = z.enum(["pending", "done", "failed"]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

// A persisted generation (SPEC §3).
export const Application = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  jdText: z.string().min(1),
  // Missing on every pre-T-021 row ⇒ treated as "done" (back-compat). New rows set it.
  status: ApplicationStatus.default("done"),
  // Optional-until-done: a pending row has no bundle yet. The "a done row has a bundle"
  // invariant is a write-time guarantee (the worker), not a schema refinement — so old
  // lenient reads still parse.
  bundle: GenerationBundle.optional(),
  // Set only when status === "failed": a short message the client can show.
  error: z.string().optional(),
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string().optional(), // ISO 8601 — stamped when the worker writes a terminal state
  deletedAt: z.string().nullish(), // ISO 8601 when soft-deleted; absent/null otherwise
});
export type Application = z.infer<typeof Application>;
