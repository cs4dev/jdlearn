import { useState } from "react";
import { Button, Card, CardBody, Input, Link } from "@heroui/react";
import { authClient } from "./auth";

// Hairline eye toggle — matches the Logo's stroke language, not an emoji. `off`
// adds the slash (password currently visible → click to hide).
function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

// Official Google mark — a sanctioned third-party logo (brand-required), the one
// place non-palette color is allowed on the auth card.
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export function AuthForm({
  initialMode = "signin",
}: {
  initialMode?: "signin" | "signup";
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: email })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error)
      setError(
        res.error.message ||
          (mode === "signup"
            ? "Couldn't create your account — that email may already be registered. Try signing in instead."
            : "Couldn't sign you in — check your email and password, or create an account."),
      );
    // Let the first authenticated screen acknowledge the new account (read once, then cleared).
    else if (mode === "signup") sessionStorage.setItem("jdlearn:justSignedUp", "1");
  }

  return (
    <Card className="h-full w-full max-w-sm border border-gray-100 shadow-sm" shadow="none">
      <CardBody className="justify-center gap-5 p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "signup" ? "Start turning JDs into applications." : "Sign in to continue."}
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            type="email"
            label="Email"
            variant="bordered"
            value={email}
            onValueChange={setEmail}
            isRequired
          />
          <Input
            type={showPw ? "text" : "password"}
            label="Password"
            variant="bordered"
            value={password}
            onValueChange={setPassword}
            minLength={8}
            description="8+ characters"
            isRequired
            endContent={
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((v) => !v)}
                className="text-gray-500 hover:text-gray-700"
              >
                <EyeIcon off={showPw} />
              </button>
            }
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            type="submit"
            color="primary"
            isLoading={busy}
            className="font-medium"
            endContent={!busy && <span aria-hidden>→</span>}
          >
            {mode === "signup" ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          or
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <Button
          variant="bordered"
          className="font-medium"
          isDisabled={busy}
          onPress={async () => {
            setError(null);
            // Flag a possible new signup so the first authenticated screen greets them.
            // The résumé gate that reads this only shows for résumé-less users, so a
            // returning Google user rarely sees it. Cleared if the redirect never happens.
            sessionStorage.setItem("jdlearn:justSignedUp", "1");
            // Redirects to Google, then back to the app origin on success (dev client runs
            // on a different port than the auth server, so use an absolute origin, not "/").
            const res = await authClient.signIn.social({
              provider: "google",
              callbackURL: window.location.origin,
            });
            if (res?.error) {
              sessionStorage.removeItem("jdlearn:justSignedUp");
              setError(res.error.message ?? "Google sign-in is unavailable.");
            }
          }}
          startContent={<GoogleIcon />}
        >
          Continue with Google
        </Button>
        <p className="text-center text-sm text-gray-500">
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <Link
            as="button"
            size="sm"
            onPress={() => {
              setError(null);
              setMode(mode === "signup" ? "signin" : "signup");
            }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500">
          Your résumé and job descriptions stay private to your account.
        </p>
      </CardBody>
    </Card>
  );
}
