import { describe, expect, it } from "vitest";
import { canImportResume, RESUME_IMPORT_WINDOW_DAYS } from "./rate-limit";

const day = 24 * 60 * 60 * 1000;
const base = new Date("2026-07-01T00:00:00.000Z");

describe("canImportResume", () => {
  it("allows a first-ever import (no prior)", () => {
    expect(canImportResume(null, base)).toEqual({ allowed: true, nextAllowedAt: null });
    expect(canImportResume(undefined, base)).toEqual({ allowed: true, nextAllowedAt: null });
  });

  it("blocks a second import within the window", () => {
    const last = base.toISOString();
    const soon = new Date(base.getTime() + 5 * day);
    const r = canImportResume(last, soon);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedAt).toBe(new Date(base.getTime() + RESUME_IMPORT_WINDOW_DAYS * day).toISOString());
  });

  it("allows again exactly at the window boundary", () => {
    const last = base.toISOString();
    const atBoundary = new Date(base.getTime() + RESUME_IMPORT_WINDOW_DAYS * day);
    expect(canImportResume(last, atBoundary).allowed).toBe(true);
  });

  it("allows after the window has passed", () => {
    const last = base.toISOString();
    const later = new Date(base.getTime() + (RESUME_IMPORT_WINDOW_DAYS + 1) * day);
    expect(canImportResume(last, later)).toEqual({ allowed: true, nextAllowedAt: null });
  });
});
