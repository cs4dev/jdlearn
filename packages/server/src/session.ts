// Shared session reading — used by tRPC context and the zip download route.
import type { IncomingHttpHeaders } from "node:http";
import { getAuth } from "./auth";

export function toHeaders(raw: IncomingHttpHeaders): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") h.set(k, v);
    else if (Array.isArray(v)) h.set(k, v.join(", "));
  }
  return h;
}

export async function getUserId(raw: IncomingHttpHeaders): Promise<string | undefined> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: toHeaders(raw) });
  return session?.user.id;
}
