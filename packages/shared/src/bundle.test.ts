import { describe, expect, it } from "vitest";
import { parseBundle, type GenerationBundle } from "./bundle";

const valid: GenerationBundle = {
  roleTitle: "Backend Engineer",
  fitAnalysis: {
    overallFit: 72,
    summary: "Strong backend match; gap on team leadership.",
    requirements: [
      { text: "5+ yrs Go", status: "match", evidence: "6 yrs Go at X", gapNote: "" },
      { text: "Led a team", status: "gap", evidence: "", gapNote: "no lead experience yet" },
    ],
  },
  coverLetter: "Dear hiring team, I'd love to apply.",
  learningPlan: [
    { title: "Learn Go basics", detail: "syntax + modules", resources: [] },
    { title: "Build an HTTP API", detail: "chi router", resources: [] },
    { title: "Add Postgres", detail: "pgx + migrations", resources: [] },
  ],
};

describe("GenerationBundle schema (frozen)", () => {
  it("accepts a valid bundle", () => {
    expect(() => parseBundle(valid)).not.toThrow();
  });

  it("rejects fewer than 3 learning steps", () => {
    const bad = { ...valid, learningPlan: valid.learningPlan.slice(0, 2) };
    expect(() => parseBundle(bad)).toThrow();
  });

  it("rejects an empty cover letter", () => {
    expect(() => parseBundle({ ...valid, coverLetter: "" })).toThrow();
  });

  it("requires a fitAnalysis with at least one requirement", () => {
    const { fitAnalysis: _omit, ...noFit } = valid;
    expect(() => parseBundle(noFit)).toThrow();
    expect(() => parseBundle({ ...valid, fitAnalysis: { ...valid.fitAnalysis, requirements: [] } })).toThrow();
  });

  it("rejects an out-of-range fit score", () => {
    expect(() => parseBundle({ ...valid, fitAnalysis: { ...valid.fitAnalysis, overallFit: 140 } })).toThrow();
  });
});
