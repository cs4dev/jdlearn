import { useEffect } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { FitAnalysis } from "@jdlearn/shared";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { AuthForm } from "./AuthForm";
import { FitMap } from "./FitMap";
import { Generator } from "./Generator";
import { Header } from "./Header";
import { PageSkeleton } from "./Skeletons";

// The landing's proof: a real-shaped fit map on a made-up role, rendered by the SAME
// FitMap component the bundle uses, so the demo can't drift from the actual result.
// The isExample badge marks it so it can't be mistaken for the visitor's own score.
const SAMPLE_FIT: FitAnalysis = {
  overallFit: 82,
  summary:
    "Strong on React and TypeScript; the one real gap is Kubernetes — which the learning plan tackles first.",
  requirements: [
    {
      text: "5+ years building production React apps",
      status: "match",
      evidence: "Led the React 19 migration across 40+ screens at Northwind.",
      gapNote: "",
    },
    {
      text: "GraphQL API design",
      status: "partial",
      evidence: "Shipped REST endpoints; some Apollo Client on the side.",
      gapNote: "",
    },
    {
      text: "Kubernetes in production",
      status: "gap",
      evidence: "",
      gapNote: "No direct Kubernetes experience yet — first step of the learning plan.",
    },
  ],
};

function SampleFitMap() {
  return (
    <Card className="border border-gray-100" shadow="sm">
      <CardBody className="p-6">
        <FitMap
          fit={SAMPLE_FIT}
          subtitle="Senior Frontend Engineer"
          isExample
          headingLevel={2}
        />
      </CardBody>
    </Card>
  );
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
  useEffect(() => {
    if (session) localStorage.setItem(SEEN_SESSION, "1");
    else if (!isPending) localStorage.removeItem(SEEN_SESSION);
  }, [session, isPending]);

  return (
    <div className="min-h-screen">
      <Header
        right={
          session && (
            <div className="flex items-center gap-1">
              <Button as={Link} to="/resume" size="sm" variant="light">
                Résumé
              </Button>
              {hasArchived && (
                <Button as={Link} to="/archived" size="sm" variant="light">
                  Archived
                </Button>
              )}
              <Button size="sm" variant="light" onPress={() => authClient.signOut()}>
                Sign out
              </Button>
            </div>
          )
        }
      />

      {isPending && maybeSignedIn ? (
        <PageSkeleton />
      ) : session ? (
        <main className="mx-auto max-w-3xl px-6 pb-20">
          <section className="py-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Turn a job post into proof.
            </h1>
            <p className="mt-3 max-w-xl text-gray-500">
              Paste a job description below and generate your application kit.
            </p>
          </section>
          <Generator />
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-6 pb-24 pt-6">
          <section className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Turn a job post into <span className="text-indigo-600">proof.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
              Add your résumé — build it or import a PDF, Word, or Markdown file — then
              paste a job description and get a tailored cover letter and a focused
              learning plan to close the gaps the role asks for.
            </p>
          </section>

          {/* Proof + form share one row so both cards align at the same top edge.
              On mobile the grid stacks: fit map (proof) above the form. */}
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-12">
            <SampleFitMap />
            <div className="flex justify-center">
              <AuthForm initialMode="signup" />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
