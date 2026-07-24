import { createAuthClient } from "better-auth/react";

// Same-origin: Vite proxies /api/auth/* to the server (default basePath /api/auth).
export const authClient = createAuthClient();
