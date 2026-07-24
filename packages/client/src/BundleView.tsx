import { useState } from "react";
import Markdown from "react-markdown";
import { Button, Card, CardBody, Chip, Divider, Textarea } from "@heroui/react";
import type { Application, FitRequirement } from "@jdlearn/shared";
import { trpc } from "./trpc";

const FIT_STATUS: Record<
  FitRequirement["status"],
  { label: string; color: "success" | "warning" | "danger" }
> = {
  match: { label: "Match", color: "success" },
  partial: { label: "Partial", color: "warning" },
  gap: { label: "Gap", color: "danger" },
};

// Strongest fit first: match → partial → gap.
const FIT_ORDER: Record<FitRequirement["status"], number> = { match: 0, partial: 1, gap: 2 };

// Minimal element styling (no typography plugin installed) — cover letters are
// paragraphs + emphasis + the occasional list.
const MD_COMPONENTS = {
  p: (props: { children?: React.ReactNode }) => <p className="mb-3" {...props} />,
  strong: (props: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  ul: (props: { children?: React.ReactNode }) => (
    <ul className="mb-3 list-inside list-disc" {...props} />
  ),
  ol: (props: { children?: React.ReactNode }) => (
    <ol className="mb-3 list-inside list-decimal" {...props} />
  ),
  a: (props: { children?: React.ReactNode; href?: string }) => (
    <a className="text-indigo-600 underline" {...props} />
  ),
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </h3>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="flat"
      color={copied ? "success" : "primary"}
      className="font-medium"
      onPress={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function BundleView({
  app,
  editable = false,
  onSaved,
}: {
  app: Application;
  editable?: boolean;
  onSaved?: (coverLetter: string) => void;
}) {
  const { bundle } = app;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const utils = trpc.useUtils();
  const save = trpc.updateCoverLetter.useMutation({
    onSuccess: () => {
      onSaved?.(draft);
      utils.listApplications.invalidate();
      setEditing(false);
    },
  });
  return (
    <Card className="border border-gray-100" shadow="sm">
      <CardBody className="gap-8 p-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-500">Tailored for</p>
          <h2 className="text-2xl font-bold tracking-tight">{bundle.roleTitle}</h2>
        </div>

        <Divider />

        {/* Fit map — the JD↔résumé connection. Guarded: pre-v4 stored bundles lack it. */}
        {bundle.fitAnalysis && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionLabel>Fit for this role</SectionLabel>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-indigo-600">
                  {bundle.fitAnalysis.overallFit}
                </span>
                <span className="text-sm text-gray-400">/ 100</span>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-600">{bundle.fitAnalysis.summary}</p>
            <ul className="space-y-3">
              {[...bundle.fitAnalysis.requirements]
                .sort((a, b) => FIT_ORDER[a.status] - FIT_ORDER[b.status])
                .map((req, i) => {
                const s = FIT_STATUS[req.status];
                return (
                  <li key={i}>
                    <Card className="border border-gray-100" shadow="none">
                      <CardBody className="flex flex-row gap-3 p-4">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={s.color}
                          classNames={{
                            base: "mt-0.5 w-16 max-w-none shrink-0 justify-center",
                            content: "w-full px-0 text-center",
                          }}
                        >
                          {s.label}
                        </Chip>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{req.text}</p>
                          {req.evidence && <p className="text-sm text-gray-600">{req.evidence}</p>}
                          {req.gapNote && <p className="text-sm text-gray-500">{req.gapNote}</p>}
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <SectionLabel>Cover letter</SectionLabel>
            <div className="flex items-center gap-2">
              {editable && !editing && (
                <Button
                  size="sm"
                  variant="flat"
                  className="font-medium"
                  onPress={() => {
                    setDraft(bundle.coverLetter);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
              {!editing && <CopyButton text={bundle.coverLetter} />}
            </div>
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea
                aria-label="Edit cover letter"
                minRows={10}
                value={draft}
                onValueChange={setDraft}
                description="Edit as Markdown — formatting renders after you save."
                classNames={{ input: "text-sm leading-relaxed" }}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  color="primary"
                  className="font-medium"
                  isDisabled={!draft.trim()}
                  isLoading={save.isPending}
                  onPress={() => save.mutate({ id: app.id, coverLetter: draft })}
                >
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="light" onPress={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
              {save.error && (
                <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                  {save.error.message}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 [&>*:last-child]:mb-0">
              <Markdown components={MD_COMPONENTS}>{bundle.coverLetter}</Markdown>
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Learning plan</SectionLabel>
          <ol className="space-y-4">
            {bundle.learningPlan.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">
                    {s.title}
                    {s.estimateHours ? (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ~{s.estimateHours}h
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-gray-600">{s.detail}</p>
                  {s.resources.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-sm text-indigo-600">
                      {s.resources.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </CardBody>
    </Card>
  );
}
