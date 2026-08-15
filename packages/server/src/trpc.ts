// tRPC router. Server is the authority (SPEC §5): the client sends only JD text / an id;
// the bundle, paths, and userId are computed server-side.
import { randomUUID } from "node:crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { z } from "zod";
import { type Application, canImportResume, Resume } from "@jdlearn/shared";
import { getUserId } from "./session";
import { generateBundle } from "./anthropic";
import { dispatchGeneration } from "./generation";
import { importResume } from "./resume-parse";
import {
  deleteApplication,
  getApplication,
  getResume,
  getResumeImportAt,
  listApplications,
  listArchivedApplications,
  purgeApplication,
  restoreApplication,
  saveApplication,
  saveResume,
  setResumeImportAt,
  updateApplicationBundle,
  updateApplicationCoverLetter,
} from "./repository";

export interface Context {
  userId?: string;
}

export async function createContext({ req }: CreateFastifyContextOptions): Promise<Context> {
  return { userId: await getUserId(req.headers) };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { userId: ctx.userId } });
});

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true as const })),

  // Async (SPEC §2 v10): persist a pending row BEFORE Claude is called, dispatch the work
  // off the request path (worker Lambda in prod, in-process locally), and return the pending
  // Application immediately. The client polls getApplication by id until terminal. The
  // request path never calls generateBundle — that runs in the worker seam.
  generate: protectedProcedure
    .input(z.object({ jdText: z.string().min(1).max(40_000) }))
    .mutation(async ({ ctx, input }): Promise<Application> => {
      const id = randomUUID();
      const app: Application = {
        id,
        userId: ctx.userId,
        jdText: input.jdText,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      await saveApplication(app); // durable BEFORE any Claude call
      await dispatchGeneration({ userId: ctx.userId, appId: id, jdText: input.jdText });
      return app; // pending — no bundle yet; client polls by app.id
    }),

  // Re-run generation for an existing app against its stored JD + the current résumé,
  // overwriting its bundle in place (SPEC §5, v5) — no new row.
  regenerateApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Application> => {
      const existing = await getApplication(ctx.userId, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const resume = await getResume(ctx.userId);
      const bundle = await generateBundle(existing.jdText, resume); // throws clear error if no key (#8)
      await updateApplicationBundle(ctx.userId, input.id, bundle);
      return { ...existing, bundle };
    }),

  // Let the user edit the generated cover letter in place (owner-scoped, live rows only).
  // Only the cover-letter string changes; the rest of the frozen bundle is untouched (R3).
  updateCoverLetter: protectedProcedure
    .input(z.object({ id: z.string(), coverLetter: z.string().min(1).max(20_000) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await updateApplicationCoverLetter(ctx.userId, input.id, input.coverLetter);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),

  listApplications: protectedProcedure.query(({ ctx }) => listApplications(ctx.userId)),

  listArchived: protectedProcedure.query(({ ctx }) => listArchivedApplications(ctx.userId)),

  getApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => getApplication(ctx.userId, input.id)),

  deleteApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => deleteApplication(ctx.userId, input.id)),

  restoreApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => restoreApplication(ctx.userId, input.id)),

  // Permanent delete — only affects already-archived rows (RULES R12 escape hatch, SPEC §5).
  purgeApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => purgeApplication(ctx.userId, input.id)),

  getResume: protectedProcedure.query(({ ctx }) => getResume(ctx.userId)),

  saveResume: protectedProcedure
    .input(Resume)
    .mutation(async ({ ctx, input }) => {
      const resume = { ...input, updatedAt: new Date().toISOString() };
      await saveResume(ctx.userId, resume);
      return resume;
    }),

  // Parse an uploaded PDF/DOCX into a Resume for the caller to review (not persisted).
  // Rate-limited to one import per user per window (checked BEFORE the Claude call to cap
  // cost); the timestamp is recorded only on a successful parse.
  importResume: protectedProcedure
    // dataBase64 bound (~7.5MB decoded) guards memory; resume-parse enforces the 5MB rule.
    .input(z.object({ filename: z.string().min(1), dataBase64: z.string().min(1).max(10_000_000) }))
    .mutation(async ({ ctx, input }) => {
      const gate = canImportResume(await getResumeImportAt(ctx.userId), new Date());
      if (!gate.allowed) {
        // YYYY-MM-DD (UTC) — locale/timezone-independent, no client date exposed.
        const next = (gate.nextAllowedAt ?? "").slice(0, 10);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `You can import one résumé per 30 days. Next import available ${next}.`,
        });
      }
      const resume = await importResume(input.filename, input.dataBase64);
      await setResumeImportAt(ctx.userId, new Date().toISOString());
      return resume;
    }),
});

export type AppRouter = typeof appRouter;
