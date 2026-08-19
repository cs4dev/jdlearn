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

// The capstone the learning plan builds toward: ONE small project, built with the
// JD's own tech stack, broken into ordered milestones (SPEC v9).
export const ProjectMilestone = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  estimateHours: z.number().positive().optional(),
});
export type ProjectMilestone = z.infer<typeof ProjectMilestone>;

export const LearningProject = z.object({
  title: z.string().min(1),
  summary: z.string().min(1), // what it is + why it exercises the role's skills
  techStack: z.array(z.string()).min(1), // technologies drawn from the JD
  milestones: z.array(ProjectMilestone).min(2),
});
export type LearningProject = z.infer<typeof LearningProject>;

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
  // The capstone project the plan builds toward (SPEC v9). Optional so pre-v9 stored
  // bundles still parse on read (R3); the emit_bundle tool requires it for new output.
  project: LearningProject.optional(),
});
export type GenerationBundle = z.infer<typeof GenerationBundle>;

/** Parse + validate raw model output. Throws ZodError on violation (RULES R3). */
export function parseBundle(raw: unknown): GenerationBundle {
  return GenerationBundle.parse(raw);
}

// overallFit is DERIVED from the statuses, not the model's guess: match=1, partial=0.5,
// gap=0, averaged ×100 and rounded. Keeps the headline score consistent with the breakdown.
const FIT_WEIGHT = { match: 1, partial: 0.5, gap: 0 } as const;
export function fitScore(requirements: ReadonlyArray<{ status: FitRequirement["status"] }>): number {
  if (requirements.length === 0) return 0;
  const total = requirements.reduce((s, r) => s + FIT_WEIGHT[r.status], 0);
  return Math.round((100 * total) / requirements.length);
}
