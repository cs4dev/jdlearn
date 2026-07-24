// Lazy Better Auth — mongodbAdapter needs a CONNECTED db, so build the instance on
// first use, not at module load (memory: don't create auth at module level).
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env } from "./env";
import { getDb } from "./db";

let auth: ReturnType<typeof betterAuth> | undefined;

export async function getAuth() {
  if (auth) return auth;
  const db = await getDb();
  const options: BetterAuthOptions = {
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS,
    emailAndPassword: { enabled: true },
    // Google sign-in only when both creds are configured — otherwise the button is a no-op path.
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          },
          // Google verifies email ownership, so trust it to link onto an existing
          // same-email account instead of erroring "account not linked".
          // requireLocalEmailVerified:false is the actual fix — by default Better Auth
          // ALSO refuses to link unless the existing local account is already
          // emailVerified, but this app has no verification flow (every password user is
          // emailVerified:false), so the link could never happen. Linking is still gated
          // on Google asserting the SAME verified email.
          account: {
            accountLinking: {
              enabled: true,
              trustedProviders: ["google"],
              requireLocalEmailVerified: false,
            },
          },
        }
      : {}),
  };
  auth = betterAuth(options);
  return auth;
}
