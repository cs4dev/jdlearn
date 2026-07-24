import { createTRPCReact } from "@trpc/react-query";
// Type-only import — the client never bundles server code (RULES R5).
import type { AppRouter } from "@jdlearn/server/trpc";

export const trpc = createTRPCReact<AppRouter>();
