import { describe, expect, it } from "vitest";
import { fitScore, parseBundle, type GenerationBundle } from "./bundle";

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
  project: {
    title: "URL shortener API",
    summary: "A small Go service that exercises the role's stack end to end.",
    techStack: ["Go", "Postgres"],
    milestones: [
      { title: "HTTP endpoints", detail: "POST /shorten, GET /:code" },
      { title: "Persist links", detail: "pgx + a migration", estimateHours: 3 },
    ],
  },
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

  it("accepts a bundle with a capstone project", () => {
    expect(() => parseBundle(valid)).not.toThrow();
    expect(parseBundle(valid).project?.techStack).toEqual(["Go", "Postgres"]);
  });

  it("stays backward-compatible: a pre-v9 bundle without a project still parses", () => {
    const { project: _omit, ...noProject } = valid;
    expect(() => parseBundle(noProject)).not.toThrow();
    expect(parseBundle(noProject).project).toBeUndefined();
  });

  it("rejects a project with fewer than 2 milestones", () => {
    const bad = { ...valid, project: { ...valid.project!, milestones: valid.project!.milestones.slice(0, 1) } };
    expect(() => parseBundle(bad)).toThrow();
  });
});

describe("fitScore — derived from statuses", () => {
  const req = (status: "match" | "partial" | "gap") => ({ status });
  it("weights match=1, partial=0.5, gap=0, averaged ×100 and rounded", () => {
    expect(fitScore([req("match"), req("gap")])).toBe(50);
    expect(fitScore([req("match"), req("partial"), req("gap")])).toBe(50); // 1.5/3
    expect(fitScore([req("match"), req("match")])).toBe(100);
    expect(fitScore([req("gap"), req("gap")])).toBe(0);
    expect(fitScore([req("match"), req("match"), req("gap")])).toBe(67); // 2/3 rounds
  });
  it("returns 0 for no requirements (no divide-by-zero)", () => {
    expect(fitScore([])).toBe(0);
  });
});
