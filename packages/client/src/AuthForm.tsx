import { useState } from "react";
import { Button, Card, CardBody, Input, Link } from "@heroui/react";
import { authClient } from "./auth";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    if (res.error) setError(res.error.message ?? "Something went wrong.");
  }

  return (
    <Card className="h-full min-h-[30rem] w-full max-w-sm border border-gray-100 shadow-sm" shadow="none">
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
                className="text-gray-400 hover:text-gray-600"
              >
                {showPw ? "🙈" : "👁"}
              </button>
            }
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" color="primary" isLoading={busy} className="font-medium">
            {mode === "signup" ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400">
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
            // Redirects to Google, then back to the app origin on success (dev client runs
            // on a different port than the auth server, so use an absolute origin, not "/").
            const res = await authClient.signIn.social({
              provider: "google",
              callbackURL: window.location.origin,
            });
            if (res?.error) setError(res.error.message ?? "Google sign-in is unavailable.");
          }}
          startContent={
            <span
              aria-hidden
              className="grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285F4] ring-1 ring-gray-200"
            >
              G
            </span>
          }
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
      </CardBody>
    </Card>
  );
}
