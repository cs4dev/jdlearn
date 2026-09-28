import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Link, Navigate } from "@tanstack/react-router";
import type { Application } from "@jdlearn/shared";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { Header, NavLink } from "./Header";
import { BundleView } from "./BundleView";
import { RowsSkeleton } from "./Skeletons";
import { ArrowLeft, Board, BoardRow } from "./sign";

export function Archived() {
  const { data: session, isPending } = authClient.useSession();
  const [viewing, setViewing] = useState<Application | null>(null);
  const [toPurge, setToPurge] = useState<Application | null>(null);
  const utils = trpc.useUtils();
  const archived = trpc.listArchived.useQuery(undefined, { enabled: !!session });
  const restore = trpc.restoreApplication.useMutation({
    onSuccess: (_ok, { id }) => {
      if (viewing?.id === id) setViewing(null);
      utils.listArchived.invalidate();
      utils.listApplications.invalidate();
    },
  });
  const purge = trpc.purgeApplication.useMutation({
    onSuccess: (_ok, { id }) => {
      if (viewing?.id === id) setViewing(null);
      setToPurge(null);
      utils.listArchived.invalidate();
    },
  });

  // Nothing to show (and no delete/restore in flight) → don't render the page.
  if (
    session &&
    archived.isSuccess &&
    archived.data.length === 0 &&
    !restore.isPending &&
    !purge.isPending
  ) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen">
      <Header
        right={
          <NavLink to="/">
            <ArrowLeft /> Back
          </NavLink>
        }
      />
      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <section className="pb-6 pt-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Archived applications</h1>
          <p className="mt-2 text-muted">Applications you've deleted.</p>
        </section>

        {isPending || (session && archived.isPending) ? (
          <RowsSkeleton />
        ) : !session ? (
          <p className="text-muted">
            Please{" "}
            <Link to="/" className="font-bold text-ink underline decoration-2 underline-offset-2">
              sign in
            </Link>
            .
          </p>
        ) : archived.data && archived.data.length > 0 ? (
          <div className="space-y-10">
            <Board title="Archived">
              {archived.data.map((a, i) => (
                <BoardRow
                  key={a.id}
                  index={i}
                  when={a.deletedAt ?? a.createdAt}
                  role={
                    a.bundle?.roleTitle ??
                    (a.status === "failed" ? "Generation failed" : "Generating…")
                  }
                  fit={a.bundle?.fitAnalysis?.overallFit}
                  status="archived"
                  active={viewing?.id === a.id}
                  onOpen={() => setViewing(a)}
                  actions={
                    <div className="flex shrink-0 flex-col items-end gap-1 py-2 sm:flex-row sm:items-center">
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-flap-dim font-sans font-bold text-white data-[hover=true]:border-flap data-[hover=true]:text-flap"
                        isLoading={restore.isPending && restore.variables?.id === a.id}
                        onPress={() => restore.mutate({ id: a.id })}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        className="font-sans font-bold text-stop-on-dark data-[hover=true]:bg-frame"
                        onPress={() => setToPurge(a)}
                      >
                        Permanently delete
                      </Button>
                    </div>
                  }
                />
              ))}
            </Board>
            {viewing && <BundleView app={viewing} />}
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing archived.</p>
        )}
      </main>

      <Modal isOpen={!!toPurge} onClose={() => setToPurge(null)} size="sm">
        <ModalContent>
          <ModalHeader className="font-extrabold">Permanently delete?</ModalHeader>
          <ModalBody>
            <p className="text-muted">
              Permanently delete the application for{" "}
              <span className="font-bold text-ink">
                {toPurge?.bundle?.roleTitle ?? "this job"}
              </span>
              .
              This can't be undone — it won't be recoverable from the archive.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="font-bold" onPress={() => setToPurge(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              className="font-bold"
              isLoading={purge.isPending}
              onPress={() => toPurge && purge.mutate({ id: toPurge.id })}
            >
              Permanently delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
