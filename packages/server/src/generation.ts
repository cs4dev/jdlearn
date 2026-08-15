// Async generation seam (T-021, SPEC §2 v10). Keeps the Claude call OFF the tRPC request
// path: `generate` persists a pending row then hands the job here. In production the work
// runs on a second Lambda (async Event invoke of the SAME zip, `worker.handler`); locally
// (no WORKER_FUNCTION_NAME) the same seam runs in-process, fire-and-forget.
import { generateBundle } from "./anthropic";
import { env } from "./env";
import { logger } from "./logger";
import { completeApplication, failApplication, getResume } from "./repository";

// The ONE unit of work both the Lambda handler and local dev invoke.
export interface GenerationJob {
  userId: string;
  appId: string;
  jdText: string;
}

/**
 * Run one generation to completion, writing a terminal state to the row.
 * Owns its own try/catch: a thrown/crashed generation ALWAYS lands `failed`, never stuck
 * `pending` (terminal-on-throw guard). The only residual is `failApplication` itself
 * failing (Mongo down) — bounded by AWS async-invoke retries; see dev-notes / design §11.
 */
export async function runGenerationJob(job: GenerationJob): Promise<void> {
  try {
    const resume = await getResume(job.userId); // personalize from real history if present
    const bundle = await generateBundle(job.jdText, resume); // may throw (no key, model, network)
    await completeApplication(job.userId, job.appId, bundle); // status → done + bundle + updatedAt
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    logger.error({ err, appId: job.appId }, "generation job failed"); // R8 pino, no bare console
    await failApplication(job.userId, job.appId, message); // status → failed + error + updatedAt
  }
}

/**
 * Fire the job off the request path. Discriminator = presence of WORKER_FUNCTION_NAME (R7),
 * NOT NODE_ENV (the gate boots NODE_ENV=production locally yet must take the in-process path).
 */
export async function dispatchGeneration(job: GenerationJob): Promise<void> {
  if (env.WORKER_FUNCTION_NAME) {
    // Lambda path: async Event invoke of the worker function. @aws-sdk/client-lambda is on
    // the Node 22 runtime and externalized in esbuild (never shipped). Import only here so
    // the in-process path never touches AWS (no import, no client, no creds needed).
    const { LambdaClient, InvokeCommand } = await import("@aws-sdk/client-lambda");
    const client = new LambdaClient({});
    await client.send(
      new InvokeCommand({
        FunctionName: env.WORKER_FUNCTION_NAME,
        InvocationType: "Event", // async; AWS retries a failed async invoke 2× on its own
        Payload: Buffer.from(JSON.stringify(job)),
      }),
    );
  } else {
    // Local/dev/gate path: run in-process, fire-and-forget. Not awaited before responding.
    void runGenerationJob(job);
  }
}
