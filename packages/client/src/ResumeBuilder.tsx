import { useEffect, useRef, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { Resume } from "@jdlearn/shared";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { Header, NavLink } from "./Header";
import { PageSkeleton } from "./Skeletons";
import { ArrowLeft, Download, Notice, Picto, Plus, Upload } from "./sign";

const EMPTY: Resume = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  experience: [],
  projects: [],
  education: [],
  skills: [],
  languages: [],
  updatedAt: "",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold tracking-tight">{children}</h2>;
}

export function ResumeBuilder() {
  const { data: session, isPending } = authClient.useSession();
  const utils = trpc.useUtils();
  const stored = trpc.getResume.useQuery(undefined, { enabled: !!session });
  const save = trpc.saveResume.useMutation({
    onSuccess: () => utils.getResume.invalidate(),
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [r, setR] = useState<Resume>(EMPTY);
  const importMut = trpc.importResume.useMutation({
    onSuccess: (parsed) => setR({ ...EMPTY, ...parsed }), // prefill for review, don't auto-save
  });

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] ?? "");
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
    importMut.mutate({ filename: file.name, dataBase64 });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }
  // Hydrate the form once the stored résumé loads.
  useEffect(() => {
    if (stored.data) setR({ ...EMPTY, ...stored.data });
  }, [stored.data]);

  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR((p) => ({ ...p, [k]: v }));

  // Save as PDF via the browser's print dialog — no dependency, native PDF output.
  function printPdf() {
    const w = window.open("", "_blank");
    if (!w) return; // popup blocked
    w.document.write(resumeHtml(r));
    w.document.close();
  }

  if (isPending) return <div className="min-h-screen"><Header right={backLink} /><PageSkeleton /></div>;
  if (!session)
    return (
      <div className="min-h-screen">
        <Header right={backLink} />
        <p className="mx-auto max-w-3xl px-4 py-10 text-muted sm:px-6">
          Please{" "}
          <Link to="/" className="font-bold text-ink underline decoration-2 underline-offset-2">
            sign in
          </Link>
          .
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <Header right={backLink} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your résumé</h1>
            <p className="mt-2 text-muted">
              Saved once and used to personalize every cover letter and learning plan.
            </p>
          </div>
          <Button
            variant="bordered"
            onPress={printPdf}
            startContent={<Download />}
            className="shrink-0 self-start border-ink bg-white font-bold sm:self-auto"
          >
            Download PDF
          </Button>
        </div>

        {/* Import drop zone — drag a file or click to browse */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.md,.markdown,.txt"
          className="hidden"
          onChange={onFile}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={importMut.isPending}
          className={`flex w-full items-center gap-4 rounded-md border-2 border-ink p-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait ${
            dragOver ? "bg-sign-yellow" : "bg-white hover:bg-surface-gray"
          }`}
        >
          <Picto size="lg">
            <Upload className="h-5 w-5" />
          </Picto>
          {importMut.isPending ? (
            <span className="font-bold" aria-live="polite">
              Reading your résumé…
            </span>
          ) : (
            <span>
              <span className="block text-lg font-extrabold">Import a résumé</span>
              <span className="text-sm text-ink-soft">
                Drag a PDF, Word, or Markdown file here, or click to browse.
              </span>
            </span>
          )}
        </button>
        {importMut.error && <Notice>{importMut.error.message}</Notice>}
        {importMut.isSuccess && !importMut.isPending && (
          <Notice tone="ok">Imported — review the fields below, then Save.</Notice>
        )}

        {/* Contact */}
        <section className="flex flex-col gap-4 rounded-md border border-rule bg-white p-5 sm:p-6">
            <SectionTitle>Contact</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" variant="bordered" isRequired value={r.fullName} onValueChange={(v) => set("fullName", v)} />
              <Input label="Email" variant="bordered" value={r.email} onValueChange={(v) => set("email", v)} />
              <Input label="Phone" variant="bordered" value={r.phone} onValueChange={(v) => set("phone", v)} />
              <Input label="Location" variant="bordered" value={r.location} onValueChange={(v) => set("location", v)} />
            </div>
            <Input
              label="Links (comma-separated)"
              variant="bordered"
              value={r.links.join(", ")}
              onValueChange={(v) => set("links", splitList(v))}
            />
          </section>

        {/* Summary */}
        <section className="flex flex-col gap-3 rounded-md border border-rule bg-white p-5 sm:p-6">
            <SectionTitle>Summary</SectionTitle>
            <Textarea
              variant="bordered"
              minRows={3}
              placeholder="A short professional summary…"
              value={r.summary}
              onValueChange={(v) => set("summary", v)}
            />
          </section>

        {/* Experience */}
        <section className="flex flex-col gap-4 rounded-md border border-rule bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <SectionTitle>Experience</SectionTitle>
              <Button size="sm" variant="bordered" className="border-ink bg-white font-bold" startContent={<Plus />} onPress={() => set("experience", [...r.experience, { company: "", title: "", start: "", end: "", bullets: [] }])}>
                Add
              </Button>
            </div>
            {r.experience.length === 0 && <p className="text-sm text-muted">No roles yet.</p>}
            {r.experience.map((e, i) => (
              <div key={i} className="space-y-3 border-t border-rule pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input size="sm" label="Title" variant="bordered" value={e.title} onValueChange={(v) => updateAt("experience", i, { ...e, title: v })} />
                  <Input size="sm" label="Company" variant="bordered" value={e.company} onValueChange={(v) => updateAt("experience", i, { ...e, company: v })} />
                  <Input size="sm" label="Start" variant="bordered" value={e.start} onValueChange={(v) => updateAt("experience", i, { ...e, start: v })} />
                  <Input size="sm" label="End" variant="bordered" value={e.end} onValueChange={(v) => updateAt("experience", i, { ...e, end: v })} />
                </div>
                <Textarea
                  size="sm"
                  label="Highlights (one per line)"
                  variant="bordered"
                  minRows={2}
                  value={e.bullets.join("\n")}
                  onValueChange={(v) => updateAt("experience", i, { ...e, bullets: v.split("\n") })}
                />
                <Button size="sm" variant="light" color="danger" className="font-bold" onPress={() => removeAt("experience", i)}>
                  Remove
                </Button>
              </div>
            ))}
          </section>

        {/* Projects */}
        <section className="flex flex-col gap-4 rounded-md border border-rule bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <SectionTitle>Projects</SectionTitle>
              <Button size="sm" variant="bordered" className="border-ink bg-white font-bold" startContent={<Plus />} onPress={() => set("projects", [...r.projects, { name: "", link: "", bullets: [] }])}>
                Add
              </Button>
            </div>
            {r.projects.length === 0 && <p className="text-sm text-muted">No projects yet.</p>}
            {r.projects.map((p, i) => (
              <div key={i} className="space-y-3 border-t border-rule pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input size="sm" label="Name" variant="bordered" value={p.name} onValueChange={(v) => updateAt("projects", i, { ...p, name: v })} />
                  <Input size="sm" label="Link" variant="bordered" value={p.link} onValueChange={(v) => updateAt("projects", i, { ...p, link: v })} />
                </div>
                <Textarea
                  size="sm"
                  label="Highlights (one per line)"
                  variant="bordered"
                  minRows={2}
                  value={p.bullets.join("\n")}
                  onValueChange={(v) => updateAt("projects", i, { ...p, bullets: v.split("\n") })}
                />
                <Button size="sm" variant="light" color="danger" className="font-bold" onPress={() => removeAt("projects", i)}>
                  Remove
                </Button>
              </div>
            ))}
          </section>

        {/* Education */}
        <section className="flex flex-col gap-4 rounded-md border border-rule bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <SectionTitle>Education</SectionTitle>
              <Button size="sm" variant="bordered" className="border-ink bg-white font-bold" startContent={<Plus />} onPress={() => set("education", [...r.education, { school: "", degree: "", start: "", end: "" }])}>
                Add
              </Button>
            </div>
            {r.education.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
            {r.education.map((ed, i) => (
              <div key={i} className="space-y-3 border-t border-rule pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input size="sm" label="School" variant="bordered" value={ed.school} onValueChange={(v) => updateAt("education", i, { ...ed, school: v })} />
                  <Input size="sm" label="Degree" variant="bordered" value={ed.degree} onValueChange={(v) => updateAt("education", i, { ...ed, degree: v })} />
                  <Input size="sm" label="Start" variant="bordered" value={ed.start} onValueChange={(v) => updateAt("education", i, { ...ed, start: v })} />
                  <Input size="sm" label="End" variant="bordered" value={ed.end} onValueChange={(v) => updateAt("education", i, { ...ed, end: v })} />
                </div>
                <Button size="sm" variant="light" color="danger" className="font-bold" onPress={() => removeAt("education", i)}>
                  Remove
                </Button>
              </div>
            ))}
          </section>

        {/* Skills */}
        <section className="flex flex-col gap-3 rounded-md border border-rule bg-white p-5 sm:p-6">
            <SectionTitle>Skills</SectionTitle>
            <Textarea
              variant="bordered"
              minRows={2}
              placeholder="one per line, e.g. TypeScript"
              value={r.skills.join("\n")}
              onValueChange={(v) => set("skills", splitLines(v))}
            />
          </section>

        {/* Languages */}
        <section className="flex flex-col gap-3 rounded-md border border-rule bg-white p-5 sm:p-6">
            <SectionTitle>Languages</SectionTitle>
            <Textarea
              variant="bordered"
              minRows={2}
              placeholder="one per line, e.g. Spanish — fluent spoken, professional written"
              value={r.languages.join("\n")}
              onValueChange={(v) => set("languages", splitLines(v))}
            />
          </section>

        {/* Save stays in reach on a long form: a sticky strip at the bottom of the viewport. */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-ink bg-concourse/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <Button color="primary" size="lg" className="font-bold" isDisabled={!r.fullName.trim()} isLoading={save.isPending} onPress={() => save.mutate(clean(r))}>
            Save résumé
          </Button>
          {save.isSuccess && !save.isPending && (
            <span role="status" className="text-sm font-bold">
              Saved.
            </span>
          )}
          {!r.fullName.trim() && <span className="text-sm text-muted">Add your full name to save.</span>}
          {save.error && (
            <span role="alert" className="text-sm font-bold text-stop">
              {save.error.message}
            </span>
          )}
        </div>
      </main>
    </div>
  );

  // helpers that close over setR
  function updateAt<K extends "experience" | "projects" | "education">(key: K, i: number, v: Resume[K][number]) {
    setR((p) => ({ ...p, [key]: p[key].map((x, j) => (j === i ? v : x)) }));
  }
  function removeAt<K extends "experience" | "projects" | "education">(key: K, i: number) {
    setR((p) => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));
  }
}

const backLink = (
  <NavLink to="/">
    <ArrowLeft /> Back
  </NavLink>
);

function splitList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

// Keep raw lines (incl. blank/in-progress ones) while typing so Enter works;
// empties are dropped in clean() on save.
function splitLines(v: string): string[] {
  return v.split("\n");
}

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

// A clean, print-optimized résumé document. Opens with the print dialog so the user
// saves it as PDF via the browser (no PDF library needed).
function resumeHtml(r: Resume): string {
  const when = (a: string, b: string) => [a, b].filter(Boolean).join(" – ");
  const contact = [r.email, r.phone, r.location, ...r.links].filter(Boolean).map(esc).join(" · ");
  const exp = r.experience
    .map(
      (e) => `<div class="item"><h3>${esc(e.title)}${e.company ? `, ${esc(e.company)}` : ""}` +
        `${when(e.start, e.end) ? `<span>${esc(when(e.start, e.end))}</span>` : ""}</h3>` +
        (e.bullets.filter(Boolean).length
          ? `<ul>${e.bullets.filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
          : "") +
        `</div>`,
    )
    .join("");
  const proj = r.projects
    .map(
      (p) => `<div class="item"><h3>${esc(p.name)}` +
        `${p.link ? `<span>${esc(p.link)}</span>` : ""}</h3>` +
        (p.bullets.filter(Boolean).length
          ? `<ul>${p.bullets.filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
          : "") +
        `</div>`,
    )
    .join("");
  const edu = r.education
    .map(
      (ed) => `<div class="item"><h3>${esc([ed.degree, ed.school].filter(Boolean).join(", "))}` +
        `${when(ed.start, ed.end) ? `<span>${esc(when(ed.start, ed.end))}</span>` : ""}</h3></div>`,
    )
    .join("");
  const skills = r.skills.filter(Boolean).map(esc).join(", ");
  const languages = r.languages.filter(Boolean).map(esc).join(", ");
  const section = (title: string, body: string) =>
    body ? `<section><h2>${title}</h2>${body}</section>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.fullName)} — résumé</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 "Atkinson Hyperlegible Next", -apple-system, Segoe UI, Roboto, sans-serif; color: #0b0b0b; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 26px; margin: 0 0 2px; }
  .contact { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #0b0b0b; border-bottom: 2px solid #0b0b0b; padding-bottom: 4px; margin: 20px 0 10px; }
  .item { margin-bottom: 10px; }
  .item h3 { font-size: 13px; margin: 0; display: flex; justify-content: space-between; gap: 12px; }
  .item h3 span { font-weight: 400; color: #6b7280; white-space: nowrap; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin: 1px 0; }
  p.summary { margin: 0; }
  @media print { body { margin: 0; } }
</style></head>
<body onload="window.print()">
  <h1>${esc(r.fullName)}</h1>
  ${contact ? `<div class="contact">${contact}</div>` : ""}
  ${r.summary ? `<section><h2>Summary</h2><p class="summary">${esc(r.summary)}</p></section>` : ""}
  ${section("Experience", exp)}
  ${section("Projects", proj)}
  ${section("Education", edu)}
  ${section("Skills", skills)}
  ${section("Languages", languages)}
</body></html>`;
}

// Drop blank bullet lines before persisting (reviewer nit — export already filters them).
function clean(r: Resume): Resume {
  return {
    ...r,
    experience: r.experience.map((e) => ({ ...e, bullets: e.bullets.filter((b) => b.trim()) })),
    projects: r.projects.map((p) => ({ ...p, bullets: p.bullets.filter((b) => b.trim()) })),
    skills: r.skills.map((s) => s.trim()).filter(Boolean),
    languages: r.languages.map((s) => s.trim()).filter(Boolean),
  };
}
