import { z } from "zod";

// The candidate's résumé (SPEC v3 §3). One per user, editable. Feeds the generation
// prompt so the cover letter is written from real history, and is itself exportable.
export const ResumeExperience = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  start: z.string().default(""), // free text, e.g. "2021" or "Jan 2021"
  end: z.string().default(""), //   free text, e.g. "Present"
  bullets: z.array(z.string()).default([]),
});
export type ResumeExperience = z.infer<typeof ResumeExperience>;

export const ResumeEducation = z.object({
  school: z.string().min(1),
  degree: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
});
export type ResumeEducation = z.infer<typeof ResumeEducation>;

export const Resume = z.object({
  fullName: z.string().trim().min(1), // non-empty after trim (SPEC §6) — rejects whitespace-only
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  links: z.array(z.string()).default([]),
  summary: z.string().default(""),
  experience: z.array(ResumeExperience).default([]),
  education: z.array(ResumeEducation).default([]),
  skills: z.array(z.string()).default([]),
  updatedAt: z.string().default(""), // ISO 8601
});
export type Resume = z.infer<typeof Resume>;

/** Parse + validate a résumé (client submissions and stored docs). */
export function parseResume(raw: unknown): Resume {
  return Resume.parse(raw);
}

/** Render a résumé to markdown — used for the generation prompt and for export. */
export function resumeToMarkdown(r: Resume): string {
  const lines: string[] = [`# ${r.fullName}`];
  const contact = [r.email, r.phone, r.location, ...r.links].filter(Boolean);
  if (contact.length) lines.push(contact.join(" · "));
  if (r.summary) lines.push("", "## Summary", r.summary);
  if (r.experience.length) {
    lines.push("", "## Experience");
    for (const e of r.experience) {
      const when = [e.start, e.end].filter(Boolean).join(" – ");
      lines.push(`### ${e.title}, ${e.company}${when ? ` (${when})` : ""}`);
      for (const b of e.bullets.filter(Boolean)) lines.push(`- ${b}`);
    }
  }
  if (r.education.length) {
    lines.push("", "## Education");
    for (const ed of r.education) {
      const when = [ed.start, ed.end].filter(Boolean).join(" – ");
      lines.push(`- ${[ed.degree, ed.school].filter(Boolean).join(", ")}${when ? ` (${when})` : ""}`);
    }
  }
  if (r.skills.filter(Boolean).length) {
    lines.push("", "## Skills", r.skills.filter(Boolean).join(", "));
  }
  return lines.join("\n");
}
