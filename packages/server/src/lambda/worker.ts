import { z } from "zod";
import { runGenerationJob } from "../generation";

// Async worker Lambda (T-021). Ships in the SAME zip as the HTTP handler (esbuild `worker`
// entrypoint) but with no Function URL — it is reached only via `InvocationType: "Event"`
// from the HTTP Lambda. The event is the JSON job payload we sent; validate it, then run
// the seam, which owns its own try/catch (terminal-on-throw → never stuck pending).
const Job = z.object({
  userId: z.string().min(1),
  appId: z.string().min(1),
  jdText: z.string().min(1),
});

export const handler = async (event: unknown): Promise<void> => {
  const job = Job.parse(event);
  await runGenerationJob(job);
};
