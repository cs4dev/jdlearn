import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button, Textarea } from "@heroui/react";
import type { Application, LearningProject } from "@jdlearn/shared";
import { trpc } from "./trpc";
import { FitMap } from "./FitMap";
import { ArrowRight, Check, Copy as CopyGlyph, Flag, Notice, Pencil, Picto } from "./sign";

// Minimal element styling (no typography plugin installed) — cover letters are
// paragraphs + emphasis + the occasional list.
const MD_COMPONENTS = {
  p: (props: { children?: React.ReactNode }) => <p className="mb-4" {...props} />,
  strong: (props: { children?: React.ReactNode }) => (
    <strong className="font-bold text-ink" {...props} />
  ),
  ul: (props: { children?: React.ReactNode }) => (
    <ul className="mb-4 list-outside list-disc pl-5" {...props} />
  ),
  ol: (props: { children?: React.ReactNode }) => (
    <ol className="mb-4 list-outside list-decimal pl-5" {...props} />
  ),
  a: (props: { children?: React.ReactNode; href?: string }) => (
    <a className="font-bold underline decoration-2 underline-offset-2" {...props} />
  ),
};

// "Icon square + label on a rule" — the sign grammar for a section head.
function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
      <Picto size="sm">{icon}</Picto>
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
  const icon = copied ? <Check /> : <CopyGlyph />;
  if (iconOnly) {
    return (
      <Button
        size="sm"
        variant="bordered"
        isIconOnly
        aria-label={copied ? "Copied" : label}
        className="border-ink bg-white"
        onPress={copy}
      >
        {icon}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="bordered"
      className="border-ink bg-white font-bold"
      startContent={icon}
      onPress={copy}
    >
      {copied ? "Copied" : label}
    </Button>
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
  // Opening an application (often from the board below) swaps content far above the
  // row — bring it into view so the click visibly lands.
  const top = useRef<HTMLElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    top.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [app.id]);
  // A pending/failed application has no bundle yet (SPEC §2 v10) — nothing to render.
  if (!bundle) return null;
  return (
    <article ref={top} className="scroll-mt-4 space-y-10">
      <header>
        <p className="text-sm font-bold text-muted">Tailored for</p>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{bundle.roleTitle}</h2>
      </header>

      {/* Fit map — the JD↔résumé connection. Guarded: pre-v4 stored bundles lack it. */}
      {bundle.fitAnalysis && <FitMap fit={bundle.fitAnalysis} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <SectionTitle icon={<Pencil className="h-3.5 w-3.5" />}>Cover letter</SectionTitle>
          <div className="flex items-center gap-2">
            {editable && !editing && (
              <Button
                size="sm"
                variant="bordered"
                className="border-ink bg-white font-bold"
                startContent={<Pencil />}
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
          <div className="space-y-3">
            <Textarea
              aria-label="Edit cover letter"
              variant="bordered"
              minRows={12}
              value={draft}
              onValueChange={setDraft}
              description="Edit as Markdown — formatting renders after you save."
              classNames={{ inputWrapper: "bg-white", input: "text-base leading-relaxed" }}
            />
            <div className="flex items-center gap-2">
              <Button
                color="primary"
                className="font-bold"
                isDisabled={!draft.trim()}
                isLoading={save.isPending}
                onPress={() => save.mutate({ id: app.id, coverLetter: draft })}
              >
                {save.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="light" className="font-bold" onPress={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
            {save.error && <Notice>{save.error.message}</Notice>}
          </div>
        ) : (
          <div className="rounded-md border border-rule bg-white px-5 py-6 text-base leading-relaxed text-ink-soft sm:px-8 sm:py-8">
            <div className="max-w-[68ch] [&>*:last-child]:mb-0">
              <Markdown components={MD_COMPONENTS}>{bundle.coverLetter}</Markdown>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="border-b-2 border-ink pb-3">
          <SectionTitle icon={<ArrowRight className="h-3.5 w-3.5" />}>Learning plan</SectionTitle>
        </div>
        {/* The route: numbered stops joined by a line, ending at the capstone "gate". */}
        <ol>
          {bundle.learningPlan.map((s, i) => {
            const last = i === bundle.learningPlan.length - 1 && !bundle.project;
            return (
              <li
                key={i}
                className={`relative pb-6 pl-12 ${
                  last
                    ? ""
                    : "before:absolute before:bottom-0 before:left-[15px] before:top-8 before:w-0.5 before:bg-ink"
                }`}
              >
                <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-[3px] bg-ink text-sm font-extrabold text-white tabular-nums">
                  {i + 1}
                </span>
                <p className="pt-1 font-bold leading-snug">
                  {s.title}
                  {s.estimateHours ? (
                    <span className="ml-2 text-sm font-normal text-muted">~{s.estimateHours}h</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
                {s.resources.length > 0 && (
                  <ul className="mt-2 list-outside list-disc space-y-0.5 pl-5 text-sm text-ink-soft">
                    {s.resources.map((r, j) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>

        {bundle.project && (
          <div className="relative -mt-4 pt-4 before:absolute before:left-[15px] before:top-0 before:h-4 before:w-0.5 before:bg-ink">
            {/* The flag is the route's last stop; the capstone hangs below it. */}
            <div className="flex items-center gap-4">
              <Picto tone="sign">
                <Flag />
              </Picto>
              <p className="font-bold">Capstone project</p>
            </div>
            <div className="mt-3 rounded-md border-2 border-ink bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-extrabold leading-snug">{bundle.project.title}</p>
                <CopyButton text={projectPrompt(bundle.project)} label="Copy project prompt" iconOnly />
              </div>
              <p className="mt-2 text-sm text-muted">{bundle.project.summary}</p>
              {bundle.project.techStack.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
                  {bundle.project.techStack.map((t, i) => (
                    <li
                      key={i}
                      className="rounded-[3px] border border-ink px-1.5 py-0.5 text-xs font-bold"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <ol className="mt-4 space-y-3 border-t-2 border-ink pt-4">
                {bundle.project.milestones.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] bg-ink text-xs font-extrabold text-white tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        {m.title}
                        {m.estimateHours ? (
                          <span className="ml-2 font-normal text-muted">~{m.estimateHours}h</span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted">{m.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
