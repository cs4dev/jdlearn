import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Textarea } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { Resume } from "@jdlearn/shared";
import { authClient } from "./auth";
import { trpc } from "./trpc";
import { Header } from "./Header";
import { PageSkeleton } from "./Skeletons";

const EMPTY: Resume = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  experience: [],
  education: [],
  skills: [],
  updatedAt: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{children}</h3>
  );
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
        <p className="mx-auto max-w-3xl px-6 py-10 text-gray-500">
          Please <Link to="/" className="text-indigo-600">sign in</Link>.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <Header right={backLink} />
      <main className="mx-auto max-w-3xl space-y-6 px-6 pb-20 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your résumé</h1>
            <p className="mt-1 text-gray-500">
              Saved once and used to personalize every cover letter and learning plan.
            </p>
          </div>
          <Button variant="flat" onPress={printPdf} className="shrink-0 font-medium">
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
          className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {importMut.isPending ? (
            <span className="text-gray-500">Reading your résumé…</span>
          ) : (
            <span className="text-gray-500">
              <span className="font-medium text-indigo-600">Import a résumé</span> — drag a
              PDF, Word, or Markdown file here, or click to browse.
            </span>
          )}
        </button>
        {importMut.error && (
          <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
            {importMut.error.message}
          </div>
        )}
        {importMut.isSuccess && !importMut.isPending && (
          <div className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success">
            Imported — review the fields below, then Save.
          </div>
        )}

        {/* Contact */}
        <Card className="border border-gray-100" shadow="sm">
          <CardBody className="gap-4 p-5">
            <SectionLabel>Contact</SectionLabel>
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
          </CardBody>
        </Card>

        {/* Summary */}
        <Card className="border border-gray-100" shadow="sm">
          <CardBody className="gap-3 p-5">
            <SectionLabel>Summary</SectionLabel>
            <Textarea
              variant="bordered"
              minRows={3}
              placeholder="A short professional summary…"
              value={r.summary}
              onValueChange={(v) => set("summary", v)}
            />
          </CardBody>
        </Card>

        {/* Experience */}
        <Card className="border border-gray-100" shadow="sm">
          <CardBody className="gap-4 p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Experience</SectionLabel>
              <Button size="sm" variant="flat" onPress={() => set("experience", [...r.experience, { company: "", title: "", start: "", end: "", bullets: [] }])}>
                + Add
              </Button>
            </div>
            {r.experience.length === 0 && <p className="text-sm text-gray-500">No roles yet.</p>}
            {r.experience.map((e, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-gray-100 p-4">
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
                <Button size="sm" variant="light" color="danger" onPress={() => removeAt("experience", i)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Education */}
        <Card className="border border-gray-100" shadow="sm">
          <CardBody className="gap-4 p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Education</SectionLabel>
              <Button size="sm" variant="flat" onPress={() => set("education", [...r.education, { school: "", degree: "", start: "", end: "" }])}>
                + Add
              </Button>
            </div>
            {r.education.length === 0 && <p className="text-sm text-gray-500">Nothing yet.</p>}
            {r.education.map((ed, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-gray-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input size="sm" label="School" variant="bordered" value={ed.school} onValueChange={(v) => updateAt("education", i, { ...ed, school: v })} />
                  <Input size="sm" label="Degree" variant="bordered" value={ed.degree} onValueChange={(v) => updateAt("education", i, { ...ed, degree: v })} />
                  <Input size="sm" label="Start" variant="bordered" value={ed.start} onValueChange={(v) => updateAt("education", i, { ...ed, start: v })} />
                  <Input size="sm" label="End" variant="bordered" value={ed.end} onValueChange={(v) => updateAt("education", i, { ...ed, end: v })} />
                </div>
                <Button size="sm" variant="light" color="danger" onPress={() => removeAt("education", i)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Skills */}
        <Card className="border border-gray-100" shadow="sm">
          <CardBody className="gap-3 p-5">
            <SectionLabel>Skills</SectionLabel>
            <Input
              variant="bordered"
              placeholder="comma-separated, e.g. TypeScript, React, Go"
              value={r.skills.join(", ")}
              onValueChange={(v) => set("skills", splitList(v))}
            />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button color="primary" className="font-medium" isDisabled={!r.fullName.trim()} isLoading={save.isPending} onPress={() => save.mutate(clean(r))}>
            Save résumé
          </Button>
          {save.isSuccess && !save.isPending && <span className="text-sm text-success">Saved.</span>}
          {save.error && <span className="text-sm text-danger">{save.error.message}</span>}
        </div>
      </main>
    </div>
  );

  // helpers that close over setR
  function updateAt<K extends "experience" | "education">(key: K, i: number, v: Resume[K][number]) {
    setR((p) => ({ ...p, [key]: p[key].map((x, j) => (j === i ? v : x)) }));
  }
  function removeAt<K extends "experience" | "education">(key: K, i: number) {
    setR((p) => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));
  }
}

const backLink = (
  <Button as={Link} to="/" size="sm" variant="light">
    ← Back
  </Button>
);

function splitList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
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
  const edu = r.education
    .map(
      (ed) => `<div class="item"><h3>${esc([ed.degree, ed.school].filter(Boolean).join(", "))}` +
        `${when(ed.start, ed.end) ? `<span>${esc(when(ed.start, ed.end))}</span>` : ""}</h3></div>`,
    )
    .join("");
  const skills = r.skills.filter(Boolean).map(esc).join(", ");
  const section = (title: string, body: string) =>
    body ? `<section><h2>${title}</h2>${body}</section>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.fullName)} — résumé</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; color: #1f2937; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 26px; margin: 0 0 2px; }
  .contact { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #6366f1; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 20px 0 10px; }
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
  ${section("Education", edu)}
  ${section("Skills", skills)}
</body></html>`;
}

// Drop blank bullet lines before persisting (reviewer nit — export already filters them).
function clean(r: Resume): Resume {
  return {
    ...r,
    experience: r.experience.map((e) => ({ ...e, bullets: e.bullets.filter((b) => b.trim()) })),
  };
}
