import { useState } from "react";
import {
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
import { RowsSkeleton } from "./Skeletons";

export function Generator() {
  const [jd, setJd] = useState("");
  const [viewing, setViewing] = useState<Application | null>(null);
  const [toDelete, setToDelete] = useState<Application | null>(null);
  const utils = trpc.useUtils();
  const resume = trpc.getResume.useQuery();
  const past = trpc.listApplications.useQuery();
  const generate = trpc.generate.useMutation({
    onSuccess: (app) => {
      setViewing(app);
      utils.listApplications.invalidate();
    },
  });
  const regenerate = trpc.regenerateApplication.useMutation({
    onSuccess: (app) => {
      setViewing(app);
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
              isDisabled={!jd.trim()}
              isLoading={generate.isPending}
              onPress={() => generate.mutate({ jdText: jd })}
              endContent={!generate.isPending && <span aria-hidden>→</span>}
            >
              {generate.isPending ? "Generating…" : "Generate"}
            </Button>
            {generate.isPending && (
              <span className="text-sm text-gray-400">
                Writing your cover letter and learning plan — this takes a moment.
              </span>
            )}
          </div>
          {generate.error && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
              {generate.error.message}
            </div>
          )}
        </CardBody>
      </Card>
      )}

      {viewing && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
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
            <span className="text-sm text-gray-400">
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
              setViewing((v) => v && { ...v, bundle: { ...v.bundle, coverLetter } })
            }
          />
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Past applications
        </h2>
        {past.isPending ? (
          <RowsSkeleton />
        ) : past.data && past.data.length > 0 ? (
          <Card className="border border-gray-100" shadow="none">
            <ul className="divide-y divide-gray-100">
              {past.data.map((a) => {
                const active = viewing?.id === a.id;
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-2 px-4 ${active ? "bg-indigo-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewing(a)}
                      className="flex-1 py-3 text-left"
                    >
                      <p className="font-medium text-gray-900">{a.bundle.roleTitle}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      aria-label={`Delete ${a.bundle.roleTitle}`}
                      onPress={() => setToDelete(a)}
                    >
                      ✕
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <p className="text-sm text-gray-400">
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
              <span className="font-medium text-gray-900">{toDelete?.bundle.roleTitle}</span>{" "}
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
