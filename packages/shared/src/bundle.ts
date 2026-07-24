// FROZEN core (SPEC §4, RULES R3) — the single contract between Claude's output,
// persistence, and the UI. Changing the shape requires a SPEC version bump.
// v2 (2026-06-30): runnable-demo feature dropped; bundle = cover letter + learning plan.
import { z } from "zod";

export const LearningStep = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  resources: z.array(z.string()).default([]),
  estimateHours: z.number().positive().optional(),
});
export type LearningStep = z.infer<typeof LearningStep>;

// The core value (SPEC v4): the explicit connection between the JD and the résumé —
// each JD requirement mapped to résumé evidence, a partial match, or a gap.
export const FitRequirement = z.object({
  text: z.string().min(1), // the JD requirement, in the JD's own terms
  status: z.enum(["match", "partial", "gap"]),
  evidence: z.string().default(""), // résumé backing for match/partial
  gapNote: z.string().default(""), // what's missing / how the plan closes it, for gap/partial
});
export type FitRequirement = z.infer<typeof FitRequirement>;

export const FitAnalysis = z.object({
  overallFit: z.number().min(0).max(100), // headline fit score
  summary: z.string().min(1),
  requirements: z.array(FitRequirement).min(1),
});
export type FitAnalysis = z.infer<typeof FitAnalysis>;

export const GenerationBundle = z.object({
  roleTitle: z.string().min(1),
  // The JD↔résumé fit map — the connection the cover letter and plan are built on.
  fitAnalysis: FitAnalysis,
  coverLetter: z.string().min(1),
  // Acceptance #2: at least 3 learning steps.
  learningPlan: z.array(LearningStep).min(3),
});
export type GenerationBundle = z.infer<typeof GenerationBundle>;

/** Parse + validate raw model output. Throws ZodError on violation (RULES R3). */
export function parseBundle(raw: unknown): GenerationBundle {
  return GenerationBundle.parse(raw);
}
