// Anthropic generation (RULES R5 — server-only). Forces a tool call so the model's
// output is structured, then validates it against the frozen schema (RULES R3).
import Anthropic from "@anthropic-ai/sdk";
import { parseBundle, type GenerationBundle, type Resume, resumeToMarkdown } from "@jdlearn/shared";
import { env } from "./env";

const SYSTEM = `You help a job seeker apply for a role described by a job description (JD).
From the JD you produce ONE bundle via the emit_bundle tool. Build it in this order — the
fit analysis is the foundation the cover letter and plan derive from:
- roleTitle: the role the JD is for.
- fitAnalysis: the explicit connection between the JD and the candidate's RÉSUMÉ. Extract
  the JD's concrete requirements (skills, years, responsibilities) and, for each, decide:
  "match" (résumé clearly shows it — cite the evidence), "partial" (some but not full
  evidence — note what's short), or "gap" (résumé shows none — note what's missing).
  overallFit is a 0–100 score reflecting the balance. summary is one or two sentences.
  If NO résumé is provided, mark requirements "gap" and say the candidate should add a
  résumé for a real assessment. Base status ONLY on résumé evidence; never invent it.
- coverLetter: a tailored cover letter (markdown ok) that FOLLOWS FROM the fit analysis —
  lead with the matches (citing the real evidence), acknowledge partials honestly, and
  don't claim gaps as strengths. First person, never inventing experience.
- learningPlan: 3+ ordered steps that close the "gap" and "partial" requirements above,
  each with concrete resources.`;

const TOOL = {
  name: "emit_bundle",
  description: "Emit the JD↔résumé fit map, then the cover letter and learning plan derived from it.",
  input_schema: {
    type: "object" as const,
    properties: {
      roleTitle: { type: "string" },
      fitAnalysis: {
        type: "object",
        properties: {
          overallFit: { type: "number", description: "0–100 fit score" },
          summary: { type: "string" },
          requirements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string", description: "the JD requirement" },
                status: { type: "string", enum: ["match", "partial", "gap"] },
                evidence: { type: "string", description: "résumé backing (match/partial)" },
                gapNote: { type: "string", description: "what's missing (gap/partial)" },
              },
              required: ["text", "status"],
            },
          },
        },
        required: ["overallFit", "summary", "requirements"],
      },
      coverLetter: { type: "string" },
      learningPlan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            resources: { type: "array", items: { type: "string" } },
            estimateHours: { type: "number" },
          },
          required: ["title", "detail", "resources"],
        },
      },
    },
    required: ["roleTitle", "fitAnalysis", "coverLetter", "learningPlan"],
  },
};

export async function generateBundle(
  jdText: string,
  resume?: Resume | null,
): Promise<GenerationBundle> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — cannot generate (see .env).");
  }
  const userContent = resume
    ? `RÉSUMÉ:\n${resumeToMarkdown(resume)}\n\n---\n\nJOB DESCRIPTION:\n${jdText}`
    : jdText;
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emit_bundle" },
    messages: [{ role: "user", content: userContent }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("model did not emit a bundle");
  }
  // R3: model output must validate against the frozen schema or be rejected.
  return parseBundle(block.input);
}
