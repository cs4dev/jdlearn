import Fastify from "fastify";
import cors from "@fastify/cors";
import { toNodeHandler } from "better-auth/node";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter, createContext } from "./trpc";
import { logger } from "./logger";
import { getAuth } from "./auth";

// Builds the fully-wired Fastify app WITHOUT listening. Shared by the local/container
// entrypoint (index.ts → .listen, also the gate's B2 boot probe) and the Lambda handler
// (lambda/http.ts). One wiring means prod (Lambda) and the gate exercise the same app.
export async function buildApp() {
  // bodyLimit fits a base64-encoded 5MB résumé upload (~6.7MB) + JSON overhead; below this,
  // Fastify's 1MiB default would 413 the importResume payload before the handler's own
  // 5MB check (resume-parse.ts) could return its clean message.
  const app = Fastify({ loggerInstance: logger, bodyLimit: 10 * 1024 * 1024 });

  await app.register(cors, { origin: true, credentials: true });

  // Liveness probe for the harness B2 boot check — no DB required.
  app.get("/api/health", () => ({ ok: true }));

  // Better Auth — hand the raw Node req/res straight to Better Auth's node handler so
  // redirects (the OAuth callback's 302 `location`), set-cookie, and all headers are emitted
  // natively. Scoped inside a plugin with a null JSON body parser so Better Auth reads the
  // raw request stream; tRPC (registered on the main app) keeps its own JSON parsing.
  await app.register(async (instance) => {
    instance.addContentTypeParser("application/json", (_req, _payload, done) => done(null, null));
    instance.all("/api/auth/*", async (request, reply) => {
      const auth = await getAuth();
      await toNodeHandler(auth.handler)(request.raw, reply.raw);
    });
  });

  await app.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: { router: appRouter, createContext },
  });

  return app;
}
