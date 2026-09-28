import { useEffect, useState } from "react";
import type { FitAnalysis } from "@jdlearn/shared";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { AuthForm } from "./AuthForm";
import { FitMap } from "./FitMap";
import { Generator } from "./Generator";
import { Header, NavButton, NavLink } from "./Header";
import { PageSkeleton } from "./Skeletons";

// The landing's proof: a real-shaped fit map on a made-up role, rendered by the SAME
// FitMap component the bundle uses, so the demo can't drift from the actual result.
// The isExample badge marks it so it can't be mistaken for the visitor's own score.
const SAMPLE_FIT: FitAnalysis = {
  overallFit: 78,
  summary:
    "Strong full-stack TypeScript; some hands-on LLM work; the one real gap is retrieval (RAG) — which the learning plan tackles first.",
  requirements: [
    {
      text: "Full-stack TypeScript: React front end, Node APIs",
      status: "match",
      evidence: "Built Northwind's React dashboard and the Node API behind it, end to end.",
      gapNote: "",
    },
    {
      text: "Shipping product features on LLM APIs",
      status: "partial",
      evidence: "Shipped an internal ticket summarizer on the Claude API.",
      gapNote: "",
    },
    {
      text: "Retrieval-augmented generation with a vector database",
      status: "gap",
      evidence: "",
      gapNote: "No RAG or vector search work yet — first step of the learning plan.",
    },
  ],
};

function SampleFitMap() {
  return <FitMap fit={SAMPLE_FIT} subtitle="Full Stack Engineer (AI)" isExample fill />;
}

// Marks that a session existed on this device, so returning users still see a skeleton
// while the session revalidates — but fresh visitors don't wait on it for content that
// needs no auth. ponytail: the session cookie is httpOnly, so JS can't read it directly.
const SEEN_SESSION = "jdlearn.hasSession";

export function Home() {
  const { data: session, isPending } = authClient.useSession();
  const archived = trpc.listArchived.useQuery(undefined, { enabled: !!session });
  const hasArchived = (archived.data?.length ?? 0) > 0;

  // Only gate the landing on the session round-trip when we have reason to believe one
  // exists. Fresh visitors see the landing immediately instead of a pointless skeleton.
  const maybeSignedIn = localStorage.getItem(SEEN_SESSION) !== null;
  // The header's "Sign in" flips the landing form (remounted via key) to sign-in mode.
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  useEffect(() => {
    if (session) localStorage.setItem(SEEN_SESSION, "1");
    else if (!isPending) localStorage.removeItem(SEEN_SESSION);
  }, [session, isPending]);

  return (
    <div className="min-h-screen">
      <Header
        wide={!session && !(isPending && maybeSignedIn)}
        right={
          !session && !(isPending && maybeSignedIn) ? (
            <NavButton
              onClick={() => {
                setAuthMode("signin");
                document.getElementById("account")?.scrollIntoView({ block: "center" });
              }}
            >
              Sign in
            </NavButton>
          ) : (
            session && (
            <>
              <NavLink to="/resume">Résumé</NavLink>
              {hasArchived && <NavLink to="/archived">Archived</NavLink>}
              <NavButton onClick={() => authClient.signOut()}>Sign out</NavButton>
            </>
            )
          )
        }
      />

      {isPending && maybeSignedIn ? (
        <PageSkeleton />
      ) : session ? (
        <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <section className="pb-6 pt-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Turn a job post into proof.
            </h1>
            <p className="mt-2 max-w-xl text-muted">
              Paste a job description below and generate your application kit.
            </p>
          </section>
          <Generator />
        </main>
      ) : (
        // One screen on desktop: headline across the top, then the example fit map (the
        // proof) and sign-up side by side with matching top and bottom edges.
        // Phones stack headline → example → sign-up and scroll.
        <main className="mx-auto max-w-6xl select-none px-4 pb-12 pt-8 sm:px-6 md:pb-8 [&_input]:select-text">
          <div className="grid gap-3 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-12">
            <h1 className="text-[clamp(2.5rem,4.6vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-balance">
              Turn a job post into{" "}
              <span className="mt-1 inline-block rounded-[3px] bg-ink px-2.5 pb-1 leading-[0.95] text-sign-yellow">
                proof.
              </span>
            </h1>
            <p className="leading-relaxed text-ink-soft md:pb-1">
              Add your résumé — build it or import a PDF, Word, or Markdown file — then
              paste a job description and get a tailored cover letter and a focused
              learning plan to close the gaps the role asks for.
            </p>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-[1.25fr_1fr] md:items-stretch md:gap-12">
            <section aria-label="Example fit map">
              <SampleFitMap />
            </section>
            <div id="account" className="scroll-mt-6">
              <AuthForm key={authMode} initialMode={authMode} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
