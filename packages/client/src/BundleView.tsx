import { useState } from "react";
import Markdown from "react-markdown";
import { Button, Card, CardBody, Divider, Textarea } from "@heroui/react";
import type { Application, LearningProject } from "@jdlearn/shared";
import { trpc } from "./trpc";
import { FitMap } from "./FitMap";

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
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </h3>
  );
}

function CopyButton({
  text,
  label = "Copy",
  iconOnly = false,
}: {
  text: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  if (iconOnly) {
    return (
      <Button
        size="sm"
        variant="light"
        isIconOnly
        aria-label={copied ? "Copied" : label}
        color={copied ? "success" : "default"}
        onPress={copy}
      >
        {copied ? "✓" : <CopyIcon />}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="flat"
      color={copied ? "success" : "primary"}
      className="font-medium"
      onPress={copy}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// A ready-to-paste brief for a coding agent (Claude Code, etc.): what to build,
// the role's stack, and the milestones as an ordered checklist.
function projectPrompt(p: LearningProject): string {
  const milestones = p.milestones
    .map((m, i) => `${i + 1}. ${m.title} — ${m.detail}`)
    .join("\n");
  return `Help me build this project. It's a learning capstone to prepare for a job, using the role's tech stack. Scaffold it, then work through the milestones in order.

# ${p.title}

${p.summary}

Tech stack: ${p.techStack.join(", ")}

## Milestones
${milestones}`;
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
  // A pending/failed application has no bundle yet (SPEC §2 v10) — nothing to render.
  if (!bundle) return null;
  return (
    <Card className="border border-gray-100" shadow="sm">
      <CardBody className="gap-8 p-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-600">Tailored for</p>
          <h2 className="text-2xl font-bold tracking-tight">{bundle.roleTitle}</h2>
        </div>

        <Divider />

        {/* Fit map — the JD↔résumé connection. Guarded: pre-v4 stored bundles lack it. */}
        {bundle.fitAnalysis && <FitMap fit={bundle.fitAnalysis} />}

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
                      <span className="ml-2 text-xs font-normal text-gray-500">
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

          {bundle.project && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Capstone project
                </p>
                <CopyButton text={projectPrompt(bundle.project)} label="Copy project prompt" iconOnly />
              </div>
              <p className="mt-1 font-semibold text-gray-900">{bundle.project.title}</p>
              <p className="mt-1 text-sm text-gray-600">{bundle.project.summary}</p>
              {bundle.project.techStack.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bundle.project.techStack.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <ol className="mt-3 space-y-2">
                {bundle.project.milestones.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-200 text-[11px] font-semibold text-indigo-800">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.title}
                        {m.estimateHours ? (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            ~{m.estimateHours}h
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-gray-600">{m.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
