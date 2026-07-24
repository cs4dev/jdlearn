import { describe, expect, it } from "vitest";
import { parseResume, resumeToMarkdown, type Resume } from "./resume";

const valid: Resume = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  location: "London",
  links: ["github.com/ada"],
  summary: "Analytical engine pioneer.",
  experience: [
    { company: "Analytical Engines", title: "Mathematician", start: "1842", end: "1843", bullets: ["Wrote the first algorithm"] },
  ],
  education: [{ school: "Home study", degree: "Mathematics", start: "", end: "" }],
  skills: ["algorithms", "mathematics"],
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("Resume schema", () => {
  it("accepts a valid résumé", () => {
    expect(() => parseResume(valid)).not.toThrow();
  });

  it("rejects an empty fullName", () => {
    expect(() => parseResume({ ...valid, fullName: "" })).toThrow();
  });

  it("fills array/string defaults for a minimal résumé", () => {
    const r = parseResume({ fullName: "Grace Hopper" });
    expect(r.experience).toEqual([]);
    expect(r.skills).toEqual([]);
    expect(r.email).toBe("");
  });
});

describe("resumeToMarkdown", () => {
  it("renders name, sections, and bullets", () => {
    const md = resumeToMarkdown(valid);
    expect(md).toContain("# Ada Lovelace");
    expect(md).toContain("## Experience");
    expect(md).toContain("- Wrote the first algorithm");
    expect(md).toContain("## Skills");
    expect(md).toContain("algorithms, mathematics");
  });

  it("omits empty sections", () => {
    const md = resumeToMarkdown(parseResume({ fullName: "Grace Hopper" }));
    expect(md).not.toContain("## Experience");
    expect(md).not.toContain("## Skills");
  });
});
