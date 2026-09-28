import { useEffect, useRef, useState } from "react";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { Application } from "@jdlearn/shared";
import { trpc } from "./trpc";
import { BundleView } from "./BundleView";
import { BundleSkeleton, RowsSkeleton } from "./Skeletons";
import { ArrowRight, ArrowSquare, Board, BoardEmpty, BoardRow, Cross, Notice, Picto, Refresh } from "./sign";

// The generation runs fit-first (read JD → map to résumé → derive letter + plan).
// Advance the status through those real stages so the ~60s wait reads as progress,
// holding on the last step rather than faking completion.
const GEN_STEPS = [
  "Reading the job description…",
  "Mapping it to your résumé…",
  "Writing your cover letter and learning plan…",
];

function GeneratingStatus() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)),
      7000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <p className="flex items-center gap-2 text-sm font-bold" aria-live="polite">
      <span className="h-2.5 w-2.5 bg-sign-yellow ring-2 ring-ink motion-safe:animate-pulse" aria-hidden />
      {GEN_STEPS[step]}
    </p>
  );
}

export function Generator() {
  const [jd, setJd] = useState("");
  const [viewing, setViewing] = useState<Application | null>(null);
  const [toDelete, setToDelete] = useState<Application | null>(null);
  // The single in-flight generation job, tracked by application id. Generation runs off the
  // request path now (SPEC §2 v10): fire → poll getApplication → toast + render on terminal.
  const [jobId, setJobId] = useState<string | null>(null);
  // Acknowledge a just-created account once, on the first authenticated screen.
  const [justSignedUp] = useState(() => {
    const flag =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem("jdlearn:justSignedUp");
    if (flag) sessionStorage.removeItem("jdlearn:justSignedUp");
    return !!flag;
  });
  const utils = trpc.useUtils();
  const resume = trpc.getResume.useQuery();
  const past = trpc.listApplications.useQuery();
  const generate = trpc.generate.useMutation({
    onSuccess: (app) => {
      // `app` is the pending row (no bundle yet) — start polling, don't view it.
      setViewing(null);
      setJobId(app.id);
      utils.listApplications.invalidate();
    },
  });

  // Poll the in-flight job until it reaches a terminal status. Stops polling (returns false)
  // on done/failed/missing — survives a reload because `jobId` is re-seeded from the pending
  // row below.
  const job = trpc.getApplication.useQuery(
    { id: jobId ?? "" },
    {
      enabled: !!jobId,
      refetchInterval: (q) => (q.state.data?.status === "pending" ? 2000 : false),
    },
  );

  // React to a terminal transition exactly once per job (guarded by the handled-id ref).
  const handledRef = useRef<string | null>(null);
  useEffect(() => {
    const j = job.data;
    if (!jobId || !j || j.id !== jobId) return;
    if (j.status === "done") {
      if (handledRef.current === jobId) return;
      handledRef.current = jobId;
      addToast({ title: "Your application is ready" });
      setViewing(j);
      setJobId(null);
      utils.listApplications.invalidate();
    } else if (j.status === "failed") {
      if (handledRef.current === jobId) return;
      handledRef.current = jobId;
      addToast({
        title: "Generation failed",
        description: j.error ?? "Something went wrong.",
        color: "danger",
      });
      // Keep jobId cleared; the failed row surfaces in the list with a Retry affordance.
      setJobId(null);
    }
  }, [job.data, jobId, utils]);

  // The just-failed job whose error + Retry we surface inline (a banner). Historical failed
  // rows appear in the past-applications list instead — we don't re-banner them on reload.
  const failedJob = job.data?.status === "failed" ? job.data : null;

  // Reconnect on reload: if the list has a still-pending job and we aren't already tracking
  // one, resume polling it. The worker owns the single in-flight job; the client only observes.
  useEffect(() => {
    if (jobId) return;
    const pending = past.data?.find((a) => a.status === "pending");
    if (pending) setJobId(pending.id);
  }, [past.data, jobId]);

  // Whether a generation is actively in flight (survives reload — gated on the polled status,
  // not the mutation's transient isPending).
  const running = !!jobId && (job.data?.status === "pending" || job.data === undefined);
  // Busy = the brief dispatch mutation OR an in-flight job. Drives the button + skeleton.
  const busy = generate.isPending || running;
  const regenerate = trpc.regenerateApplication.useMutation({
    onSuccess: (app) => {
      // `app` is now pending (no fresh bundle yet) — poll it like a new generation.
      // Same id as a prior done job → clear the once-per-job guard so its completion fires.
      handledRef.current = null;
      setViewing(null);
      setJobId(app.id);
      utils.listApplications.invalidate();
    },
  });
  const del = trpc.deleteApplication.useMutation({
    onSuccess: (_ok, { id }) => {
      if (viewing?.id === id) setViewing(null);
      setToDelete(null);
      utils.listApplications.invalidate();
      utils.listArchived.invalidate(); // surface the Archived nav link
    },
  });

  return (
    <div className="space-y-10">
      {resume.isPending ? (
        <RowsSkeleton />
      ) : !resume.data ? (
        // Wayfinding: the one next step, signed in yellow.
        <div className="flex flex-col gap-4 rounded-md bg-sign-yellow p-5 ring-2 ring-ink sm:flex-row sm:items-start sm:p-6">
          <Picto size="lg">
            <ArrowRight className="h-6 w-6" />
          </Picto>
          <div className="space-y-3">
            {justSignedUp && (
              <p className="text-sm font-bold text-on-yellow-muted">You're in — one quick step</p>
            )}
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              Add your résumé first
            </h2>
            <p className="max-w-prose text-on-yellow-muted">
              Your cover letter and fit map are built from your real experience. Add a
              résumé — build it or import a PDF, Word, or Markdown file — before pasting a
              job description.
            </p>
            <Button
              as={Link}
              to="/resume"
              color="primary"
              size="lg"
              className="font-bold"
              startContent={<ArrowSquare />}
            >
              Add your résumé
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-md border border-rule bg-white p-5 sm:p-6">
          <Textarea
            label="Job description"
            labelPlacement="outside"
            variant="bordered"
            placeholder="Paste the full job description here…"
            minRows={8}
            value={jd}
            onValueChange={setJd}
            classNames={{ label: "text-base font-bold", input: "font-mono text-sm placeholder:text-default-500" }}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button
              color="primary"
              size="lg"
              className="font-bold"
              isDisabled={!jd.trim() || busy}
              isLoading={busy}
              onPress={() => generate.mutate({ jdText: jd })}
              startContent={!busy && <ArrowSquare />}
            >
              {busy ? "Generating…" : "Generate"}
            </Button>
            {running && <GeneratingStatus />}
          </div>
          {/* The dispatch itself failed (couldn't even queue the job). */}
          {generate.error && (
            <Notice onRetry={() => generate.mutate({ jdText: jd })}>
              Couldn't start generation: {generate.error.message}
            </Notice>
          )}
          {/* The generation ran but failed — surface its error + a Retry that re-fires it. */}
          {failedJob && (
            <Notice onRetry={() => generate.mutate({ jdText: failedJob.jdText })}>
              Generation failed: {failedJob.error ?? "Something went wrong."}
            </Notice>
          )}
        </div>
      )}

      {/* Preview the incoming bundle's shape during the long generation. */}
      {running && <BundleSkeleton />}

      {viewing && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2 border-y border-rule py-3 sm:flex-row sm:items-center sm:gap-3">
            <Button
              size="sm"
              variant="bordered"
              className="border-ink bg-white font-bold"
              startContent={!regenerate.isPending && <Refresh />}
              isLoading={regenerate.isPending}
              onPress={() => regenerate.mutate({ id: viewing.id })}
            >
              {regenerate.isPending ? "Regenerating…" : "Regenerate with current résumé"}
            </Button>
            <span className="text-sm text-muted">
              Updated your résumé? Refresh this application in place.
            </span>
          </div>
          {regenerate.error && <Notice>{regenerate.error.message}</Notice>}
          <BundleView
            app={viewing}
            editable
            onSaved={(coverLetter) =>
              setViewing((v) =>
                v && v.bundle ? { ...v, bundle: { ...v.bundle, coverLetter } } : v,
              )
            }
          />
        </div>
      )}

      <section>
        {past.isPending ? (
          <RowsSkeleton />
        ) : (
          <Board title="Past applications" busy={running}>
            {past.data && past.data.length > 0 ? (
              past.data.map((a, i) => {
                // Rows may now be pending/failed with no bundle (SPEC §2 v10) — label + guard.
                const label = a.bundle
                  ? a.bundle.roleTitle
                  : a.status === "failed"
                    ? "Generation failed"
                    : "Generating…";
                return (
                  <BoardRow
                    key={a.id}
                    index={i}
                    when={a.createdAt}
                    role={label}
                    fit={a.bundle?.fitAnalysis?.overallFit}
                    status={a.status}
                    active={viewing?.id === a.id}
                    onOpen={a.bundle ? () => setViewing(a) : undefined}
                    actions={
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-flap-dim data-[hover=true]:bg-frame data-[hover=true]:text-stop-on-dark"
                        aria-label={`Delete ${label}`}
                        onPress={() => setToDelete(a)}
                      >
                        <Cross />
                      </Button>
                    }
                  />
                );
              })
            ) : (
              <BoardEmpty>Nothing yet — generate your first application above.</BoardEmpty>
            )}
          </Board>
        )}
      </section>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} size="sm">
        <ModalContent>
          <ModalHeader className="font-extrabold">Delete application?</ModalHeader>
          <ModalBody>
            <p className="text-muted">
              This removes the application for{" "}
              <span className="font-bold text-ink">
                {toDelete?.bundle?.roleTitle ?? "this job"}
              </span>{" "}
              from your list.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="font-bold" onPress={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              className="font-bold"
              isLoading={del.isPending}
              onPress={() => toDelete && del.mutate({ id: toDelete.id })}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
