import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { AuthForm } from "./AuthForm";
import { Generator } from "./Generator";
import { Header } from "./Header";
import { PageSkeleton } from "./Skeletons";

const PERKS = [
  ["📄", "Your résumé", "build it or upload a PDF, Word, or Markdown file — the letter uses your real experience"],
  ["📝", "Cover letter", "tailored to the role, editable, ready to copy and send"],
  ["🎯", "Learning plan", "ordered steps to close the JD's gaps"],
] as const;

export function Home() {
  const { data: session, isPending } = authClient.useSession();
  const archived = trpc.listArchived.useQuery(undefined, { enabled: !!session });
  const hasArchived = (archived.data?.length ?? 0) > 0;

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

      {isPending ? (
        <PageSkeleton />
      ) : session ? (
        <main className="mx-auto max-w-3xl px-6 pb-20">
          <section className="py-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Turn a job post into proof.
            </h1>
            <p className="mt-3 max-w-xl text-gray-500">
              Paste a job description below and generate your application kit.
            </p>
          </section>
          <Generator />
        </main>
      ) : (
        <main className="mx-auto grid max-w-4xl content-start items-stretch gap-10 px-6 pb-20 pt-6 md:grid-cols-2 md:gap-8">
          <section className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Turn a job post into{" "}
              <span className="text-indigo-600">proof.</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Upload your résumé, paste a job description, and get a tailored cover
              letter and a focused learning plan to close the gaps the role asks for.
            </p>
            <ul className="mt-8 space-y-4">
              {PERKS.map(([icon, title, desc]) => (
                <li
                  key={title}
                  className="flex items-center justify-center gap-3 md:justify-start"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-base shadow-sm">
                    {icon}
                  </span>
                  <p className="text-left text-gray-500">
                    <span className="font-semibold text-gray-900">{title}</span> — {desc}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex h-full justify-center md:justify-end">
            <AuthForm />
          </div>
        </main>
      )}
    </div>
  );
}
