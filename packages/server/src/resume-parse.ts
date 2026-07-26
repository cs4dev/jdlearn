// Résumé import (SPEC v3.1): extract text from an uploaded PDF/DOCX, then have Claude
// structure it into the Resume shape. Anthropic stays server-only (R5).
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { parseResume, type Resume } from "@jdlearn/shared";
import { env } from "./env";
import { logger } from "./logger";

const MAX_BYTES = 5 * 1024 * 1024; // ponytail: 5MB cap, plenty for a résumé

/** Extract plain text from a résumé file by type. Throws on unsupported/oversized input. */
async function extractResumeText(filename: string, buf: Buffer): Promise<string> {
  if (buf.length > MAX_BYTES) throw new Error("File too large (max 5MB).");
  const name = filename.toLowerCase();
  if (name.endsWith(".pdf") || buf.subarray(0, 5).toString() === "%PDF-") {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    return buf.toString("utf8");
  }
  throw new Error("Unsupported file type — upload a PDF, Word (.docx), or Markdown file.");
}

const SYSTEM = `Extract the candidate's résumé into structured fields via emit_resume.
Use ONLY information present in the text — never invent roles, dates, or skills. Leave a
field empty if the text doesn't provide it. Keep experience/education in reverse-chronological
order as written. Capture personal/side/portfolio projects (often under a "Projects" heading,
or listed with a repo/demo link) as projects, distinct from employment under experience.`;

const TOOL = {
  name: "emit_resume",
  description: "Emit the structured résumé extracted from the document text.",
  input_schema: {
    type: "object" as const,
    properties: {
      fullName: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      location: { type: "string" },
      links: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            title: { type: "string" },
            start: { type: "string" },
            end: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["company", "title"],
        },
      },
      projects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            link: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["name"],
        },
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            school: { type: "string" },
            degree: { type: "string" },
            start: { type: "string" },
            end: { type: "string" },
          },
          required: ["school"],
        },
      },
      skills: { type: "array", items: { type: "string" } },
    },
    required: ["fullName"],
  },
};

/** Parse an uploaded résumé file into a validated Resume (not persisted — caller reviews). */
export async function importResume(filename: string, dataBase64: string): Promise<Resume> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — cannot import (see .env).");
  }
  const buf = Buffer.from(dataBase64, "base64");
  const text = (await extractResumeText(filename, buf)).trim();
  if (!text) throw new Error("Couldn't read any text from that file.");

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: env.ANTHROPIC_EXTRACT_MODEL, // cheap model — extraction is a structured-parse task
    max_tokens: 4000,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emit_resume" },
    messages: [{ role: "user", content: text.slice(0, 30_000) }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("could not extract a résumé");
  logger.info({ filename, chars: text.length }, "résumé imported");
  // Zod fills defaults for anything the model omitted; updatedAt set on save, not here.
  return parseResume(block.input);
}
