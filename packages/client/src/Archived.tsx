import { useState } from "react";
import {
  Button,
  Card,
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
import { Header } from "./Header";
import { BundleView } from "./BundleView";
import { RowsSkeleton } from "./Skeletons";

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
          <Button as={Link} to="/" size="sm" variant="light">
            ← Back
          </Button>
        }
      />
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <section className="py-8">
          <h1 className="text-3xl font-bold tracking-tight">Archived applications</h1>
          <p className="mt-3 text-gray-500">Applications you've deleted.</p>
        </section>

        {isPending || (session && archived.isPending) ? (
          <RowsSkeleton />
        ) : !session ? (
          <p className="text-gray-500">
            Please <Link to="/" className="text-indigo-600">sign in</Link>.
          </p>
        ) : archived.data && archived.data.length > 0 ? (
          <div className="space-y-8">
            <Card className="border border-gray-100" shadow="none">
              <ul className="divide-y divide-gray-100">
                {archived.data.map((a) => (
                  <li
                    key={a.id}
                    className={`flex items-center gap-2 px-4 ${viewing?.id === a.id ? "bg-indigo-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewing(a)}
                      className="flex-1 py-3 text-left"
                    >
                      <p className="font-medium text-gray-900">
                        {a.bundle?.roleTitle ??
                          (a.status === "failed" ? "Generation failed" : "Generating…")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Deleted {a.deletedAt ? new Date(a.deletedAt).toLocaleString() : "—"}
                      </p>
                    </button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      isLoading={restore.isPending && restore.variables?.id === a.id}
                      onPress={() => restore.mutate({ id: a.id })}
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => setToPurge(a)}
                    >
                      Permanently delete
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
            {viewing && <BundleView app={viewing} />}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nothing archived.</p>
        )}
      </main>

      <Modal isOpen={!!toPurge} onClose={() => setToPurge(null)} size="sm">
        <ModalContent>
          <ModalHeader>Permanently delete?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600">
              Permanently delete the application for{" "}
              <span className="font-medium text-gray-900">
                {toPurge?.bundle?.roleTitle ?? "this job"}
              </span>
              .
              This can't be undone — it won't be recoverable from the archive.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setToPurge(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
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
