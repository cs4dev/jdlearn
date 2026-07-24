import { buildApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";
import { closeDb } from "./db";

// Local + container entrypoint (also the gate's B2 boot probe). Lambda uses
// lambda/http.ts instead — both share buildApp().
const app = await buildApp();

const close = async () => {
  await app.close();
  await closeDb();
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (err) {
  logger.error(err);
  process.exit(1);
}
