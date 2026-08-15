import { describe, expect, it } from "vitest";
import { Application, ApplicationStatus, type GenerationBundle } from "./index";

const bundle: GenerationBundle = {
  roleTitle: "Backend Engineer",
  fitAnalysis: {
    overallFit: 72,
    summary: "Strong backend match.",
    requirements: [{ text: "5+ yrs Go", status: "match", evidence: "6 yrs Go", gapNote: "" }],
  },
  coverLetter: "Dear hiring team.",
  learningPlan: [
    { title: "a", detail: "a", resources: [] },
    { title: "b", detail: "b", resources: [] },
    { title: "c", detail: "c", resources: [] },
  ],
  project: {
    title: "URL shortener",
    summary: "A small Go service.",
    techStack: ["Go"],
    milestones: [
      { title: "endpoints", detail: "routes" },
      { title: "persist", detail: "db", estimateHours: 3 },
    ],
  },
};

describe("Application schema (T-021 async lifecycle)", () => {
  it("treats a legacy row (bundle, no status) as done — back-compat (A5)", () => {
    const legacy = {
      id: "a1",
      userId: "u1",
      jdText: "some jd",
      bundle,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const parsed = Application.parse(legacy);
    expect(parsed.status).toBe("done");
    expect(parsed.bundle).toBeDefined();
  });

  it("parses a pending row with no bundle (A2)", () => {
    const pending = {
      id: "a2",
      userId: "u1",
      jdText: "some jd",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const parsed = Application.parse(pending);
    expect(parsed.status).toBe("pending");
    expect(parsed.bundle).toBeUndefined();
  });

  it("parses a failed row with an error message", () => {
    const failed = {
      id: "a3",
      userId: "u1",
      jdText: "some jd",
      status: "failed",
      error: "boom",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:01:00.000Z",
    };
    const parsed = Application.parse(failed);
    expect(parsed.status).toBe("failed");
    expect(parsed.error).toBe("boom");
    expect(parsed.bundle).toBeUndefined();
  });

  it("enumerates exactly the three lifecycle states", () => {
    expect(ApplicationStatus.options).toEqual(["pending", "done", "failed"]);
  });
});
