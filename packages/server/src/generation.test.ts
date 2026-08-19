import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBundle, type GenerationBundle } from "@jdlearn/shared";

// --- Mocks: no Mongo, no Anthropic. -----------------------------------------
// Repository is fully mocked (no DB). Anthropic's generateBundle is a spy.
const saveApplication = vi.fn((_app: unknown) => Promise.resolve());
const getResume = vi.fn((_userId: string) => Promise.resolve(null));
const completeApplication = vi.fn((_u: string, _id: string, _b: unknown) => Promise.resolve(true));
const failApplication = vi.fn((_u: string, _id: string, _e: string) => Promise.resolve(true));
const getApplication = vi.fn((_u: string, _id: string) => Promise.resolve<unknown>(null));
const rependApplication = vi.fn((_u: string, _id: string) => Promise.resolve(true));
const generateBundle = vi.fn();

vi.mock("./repository", () => ({
  saveApplication,
  getResume,
  completeApplication,
  failApplication,
  getApplication,
  rependApplication,
  // The rest of the router's imports — present so the module loads; never called here.
  listApplications: vi.fn(),
  listArchivedApplications: vi.fn(),
  deleteApplication: vi.fn(),
  restoreApplication: vi.fn(),
  purgeApplication: vi.fn(),
  saveResume: vi.fn(),
  getResumeImportAt: vi.fn(),
  setResumeImportAt: vi.fn(),
  updateApplicationBundle: vi.fn(),
  updateApplicationCoverLetter: vi.fn(),
}));

vi.mock("./anthropic", () => ({ generateBundle }));

// Partial-mock ./generation: spy `dispatchGeneration` (so the tRPC request-path tests can
// assert it fired WITHOUT running the real work), but keep `runGenerationJob` real for the
// seam tests. T6 pulls the REAL dispatchGeneration via importActual.
const dispatchGeneration = vi.fn(async () => {});
vi.mock("./generation", async (importActual) => {
  const actual = await importActual<typeof import("./generation")>();
  return { ...actual, dispatchGeneration };
});

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

beforeEach(() => {
  vi.clearAllMocks();
  getResume.mockResolvedValue(null);
  saveApplication.mockResolvedValue(undefined);
  completeApplication.mockResolvedValue(true);
  failApplication.mockResolvedValue(true);
});

describe("generate mutation — off the request path (A1/A2)", () => {
  it("T1: persists a pending app, dispatches, and never calls generateBundle on the request path", async () => {
    const { appRouter } = await import("./trpc");
    const caller = appRouter.createCaller({ userId: "u1" });

    const app = await caller.generate({ jdText: "some job description" });

    expect(app.status).toBe("pending");
    expect(app.bundle).toBeUndefined();
    expect(dispatchGeneration).toHaveBeenCalledOnce();
    expect(dispatchGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", appId: app.id, jdText: "some job description" }),
    );
    // The Claude call must NOT happen on the request path.
    expect(generateBundle).not.toHaveBeenCalled();
  });

  it("T2: saves the pending row BEFORE dispatching", async () => {
    const { appRouter } = await import("./trpc");
    const caller = appRouter.createCaller({ userId: "u1" });

    await caller.generate({ jdText: "another jd" });

    expect(saveApplication).toHaveBeenCalledOnce();
    const saved = saveApplication.mock.calls[0]![0] as { bundle?: unknown };
    expect(saved).toMatchObject({ userId: "u1", jdText: "another jd", status: "pending" });
    expect(saved.bundle).toBeUndefined();
    // Ordering: save resolved before dispatch was invoked.
    expect(saveApplication.mock.invocationCallOrder[0]!).toBeLessThan(
      dispatchGeneration.mock.invocationCallOrder[0]!,
    );
  });
});

describe("regenerateApplication — also off the request path", () => {
  it("resets the row to pending, dispatches, and never calls generateBundle on the request path", async () => {
    getApplication.mockResolvedValue({ id: "app-9", userId: "u1", jdText: "stored jd", status: "done" });
    const { appRouter } = await import("./trpc");
    const caller = appRouter.createCaller({ userId: "u1" });

    const app = await caller.regenerateApplication({ id: "app-9" });

    expect(app.status).toBe("pending");
    expect(rependApplication).toHaveBeenCalledWith("u1", "app-9");
    expect(dispatchGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", appId: "app-9", jdText: "stored jd" }),
    );
    // Repend (durable pending) must land before dispatch.
    expect(rependApplication.mock.invocationCallOrder[0]!).toBeLessThan(
      dispatchGeneration.mock.invocationCallOrder[0]!,
    );
    expect(generateBundle).not.toHaveBeenCalled();
  });
});

describe("runGenerationJob — terminal writes (A3/A4)", () => {
  it("T3: a successful generation marks the app done with a schema-valid bundle", async () => {
    generateBundle.mockResolvedValue(bundle);
    const { runGenerationJob } = await import("./generation");

    await runGenerationJob({ userId: "u1", appId: "app-1", jdText: "jd" });

    expect(completeApplication).toHaveBeenCalledWith("u1", "app-1", bundle);
    expect(failApplication).not.toHaveBeenCalled();
    // The bundle handed to completeApplication parses against the frozen schema (R3).
    const written = completeApplication.mock.calls[0]![2];
    expect(() => parseBundle(written)).not.toThrow();
  });

  it("T4: a thrown generation lands failed with a non-empty message, never pending (terminal-on-throw)", async () => {
    generateBundle.mockRejectedValue(new Error("ANTHROPIC_API_KEY is not set"));
    const { runGenerationJob } = await import("./generation");

    await runGenerationJob({ userId: "u1", appId: "app-2", jdText: "jd" });

    expect(completeApplication).not.toHaveBeenCalled();
    expect(failApplication).toHaveBeenCalledOnce();
    const [uid, appId, message] = failApplication.mock.calls[0]!;
    expect(uid).toBe("u1");
    expect(appId).toBe("app-2");
    expect(message).toBeTruthy();
    expect(message.length).toBeGreaterThan(0);
  });
});

describe("dispatchGeneration — in-process when WORKER_FUNCTION_NAME unset (A6)", () => {
  it("T6: runs the seam in-process without touching AWS and without throwing (no creds needed)", async () => {
    // env default for WORKER_FUNCTION_NAME is "" in the gate/local — take the in-process path.
    expect(process.env.WORKER_FUNCTION_NAME ?? "").toBe("");
    generateBundle.mockResolvedValue(bundle);
    // The REAL dispatchGeneration (bypassing the partial mock's spy).
    const actual = await vi.importActual<typeof import("./generation")>("./generation");

    // Must resolve without importing @aws-sdk/client-lambda or needing AWS credentials.
    await expect(
      actual.dispatchGeneration({ userId: "u1", appId: "app-3", jdText: "jd" }),
    ).resolves.toBeUndefined();

    // Fire-and-forget: let the in-process microtask settle, then the seam completed the row.
    await new Promise((r) => setTimeout(r, 0));
    expect(generateBundle).toHaveBeenCalledWith("jd", null);
    expect(completeApplication).toHaveBeenCalledWith("u1", "app-3", bundle);
  });
});
