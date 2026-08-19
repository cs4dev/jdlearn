import { useEffect, useRef, useState } from "react";
import {
  addToast,
  Button,
  Card,
  CardBody,
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
    <p className="text-sm text-gray-500" aria-live="polite">
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
      addToast({ title: "Your application is ready", color: "success" });
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
    <div className="space-y-8">
      {resume.isPending ? (
        <RowsSkeleton />
      ) : !resume.data ? (
        <Card className="border border-indigo-100 bg-indigo-50/40" shadow="sm">
          <CardBody className="items-start gap-3 p-5">
            {justSignedUp && (
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                You're in — one quick step
              </p>
            )}
            <h2 className="text-lg font-semibold text-gray-900">Add your résumé first</h2>
            <p className="text-sm text-gray-500">
              Your cover letter and fit map are built from your real experience. Add a
              résumé — build it or import a PDF, Word, or Markdown file — before pasting a
              job description.
            </p>
            <Button
              as={Link}
              to="/resume"
              color="primary"
              className="font-medium"
              endContent={<span aria-hidden>→</span>}
            >
              Add your résumé
            </Button>
          </CardBody>
        </Card>
      ) : (
      <Card className="border border-gray-100" shadow="sm">
        <CardBody className="gap-4 p-5">
          <Textarea
            label="Job description"
            labelPlacement="outside"
            placeholder="Paste the full job description here…"
            minRows={8}
            value={jd}
            onValueChange={setJd}
            classNames={{ input: "font-mono text-sm" }}
          />
          <div className="flex items-center gap-3">
            <Button
              color="primary"
              className="font-medium"
              isDisabled={!jd.trim() || busy}
              isLoading={busy}
              onPress={() => generate.mutate({ jdText: jd })}
              endContent={!busy && <span aria-hidden>→</span>}
            >
              {busy ? "Generating…" : "Generate"}
            </Button>
            {running && <GeneratingStatus />}
          </div>
          {/* The dispatch itself failed (couldn't even queue the job). */}
          {generate.error && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
              <p>Couldn't start generation: {generate.error.message}</p>
              <button
                type="button"
                className="mt-1 font-medium underline underline-offset-2"
                onClick={() => generate.mutate({ jdText: jd })}
              >
                Try again
              </button>
            </div>
          )}
          {/* The generation ran but failed — surface its error + a Retry that re-fires it. */}
          {failedJob && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
              <p>Generation failed: {failedJob.error ?? "Something went wrong."}</p>
              <button
                type="button"
                className="mt-1 font-medium underline underline-offset-2"
                onClick={() => generate.mutate({ jdText: failedJob.jdText })}
              >
                Try again
              </button>
            </div>
          )}
        </CardBody>
      </Card>
      )}

      {/* Preview the incoming bundle's shape during the long generation. */}
      {running && <BundleSkeleton />}

      {viewing && (
        <div className="space-y-3">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              className="font-medium"
              isLoading={regenerate.isPending}
              onPress={() => regenerate.mutate({ id: viewing.id })}
            >
              {regenerate.isPending ? "Regenerating…" : "Regenerate with current résumé"}
            </Button>
            <span className="text-sm text-gray-500">
              Updated your résumé? Refresh this application in place.
            </span>
          </div>
          {regenerate.error && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
              {regenerate.error.message}
            </div>
          )}
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
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Past applications
        </h2>
        {past.isPending ? (
          <RowsSkeleton />
        ) : past.data && past.data.length > 0 ? (
          <Card className="border border-gray-100" shadow="none">
            <ul className="divide-y divide-gray-100">
              {past.data.map((a) => {
                const active = viewing?.id === a.id;
                // Rows may now be pending/failed with no bundle (SPEC §2 v10) — label + guard.
                const label = a.bundle
                  ? a.bundle.roleTitle
                  : a.status === "failed"
                    ? "Generation failed"
                    : "Generating…";
                const openable = !!a.bundle;
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-2 px-4 ${active ? "bg-indigo-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => openable && setViewing(a)}
                      disabled={!openable}
                      className="flex-1 py-3 text-left disabled:cursor-default"
                    >
                      <p
                        className={`font-medium ${a.status === "failed" ? "text-danger" : "text-gray-900"}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      aria-label={`Delete ${label}`}
                      onPress={() => setToDelete(a)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className="h-4 w-4"
                        aria-hidden
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <p className="text-sm text-gray-500">
            Nothing yet — generate your first application above.
          </p>
        )}
      </section>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} size="sm">
        <ModalContent>
          <ModalHeader>Delete application?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600">
              This removes the application for{" "}
              <span className="font-medium text-gray-900">
                {toDelete?.bundle?.roleTitle ?? "this job"}
              </span>{" "}
              from your list.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
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
