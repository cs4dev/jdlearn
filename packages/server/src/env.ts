// Config from env only (RULES R(config)). No hardcoded secrets/URLs.
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  MONGO_URL: z.string().default("mongodb://localhost:27017"),
  MONGO_DB: z.string().default("jdlearn"),
  BETTER_AUTH_SECRET: z.string().min(16).default("dev-secret-change-me-32chars-min-xxxx"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  // Comma-separated origins allowed to call auth (the web app runs on a different port
  // in dev). Better Auth rejects mismatched Origin otherwise.
  // Both common Vite dev ports — 5173, and 5174 when 5173 is already taken.
  TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  // Google OAuth (Better Auth social provider). Both must be set to enable the Google
  // sign-in button; the redirect URI to register is `${BETTER_AUTH_URL}/api/auth/callback/google`.
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  ANTHROPIC_API_KEY: z.string().default(""),
  // Generation (cover letter + plan) — quality matters, use the strong model.
  ANTHROPIC_MODEL: z.string().default("claude-opus-4-8"),
  // Résumé extraction — a structured-parse task; a cheap fast model is plenty.
  ANTHROPIC_EXTRACT_MODEL: z.string().default("claude-haiku-4-5"),
  DATA_DIR: z.string().default("./data"),
});

export const env = Env.parse(process.env);
export type AppEnv = z.infer<typeof Env>;
