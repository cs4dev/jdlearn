/**
 * Developer-facing CLI for the synthetic-data platform.
 *
 * Mirrors how an internal stakeholder or another service would drive the API.
 * Usage:
 *   npm start -- submit --scene cargo-port --frames 24
 *   npm start -- list
 *   npm start -- get --id 1
 */

const BASE = process.env.BIFROST_API ?? "http://localhost:8000";

type Args = Record<string, string>;

function parseArgs(argv: string[]): { cmd: string; args: Args } {
  const [cmd, ...rest] = argv;
  const args: Args = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    args[key] = rest[i + 1];
  }
  return { cmd, args };
}

async function submit(args: Args) {
  const body = {
    scene: args.scene ?? "cargo-port",
    frames: Number(args.frames ?? 24),
    spec: { lighting: "randomized", weather: "clear" },
  };
  const res = await fetch(`${BASE}/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const job = await res.json();
  console.log(`Submitted job #${job.id} (${job.status}). Polling...`);
  await poll(job.id);
}

async function poll(id: number) {
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${BASE}/jobs/${id}`);
    const job = await res.json();
    process.stdout.write(`\r  status: ${job.status}        `);
    if (job.status === "completed" || job.status === "failed") {
      console.log("\n  artifacts:");
      for (const a of job.artifacts) console.log(`    - ${a.kind}: ${a.uri}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function list() {
  const res = await fetch(`${BASE}/jobs`);
  const jobs = await res.json();
  console.table(jobs);
}

async function get(args: Args) {
  const res = await fetch(`${BASE}/jobs/${args.id}`);
  console.log(JSON.stringify(await res.json(), null, 2));
}

const { cmd, args } = parseArgs(process.argv.slice(2));
const handlers: Record<string, (a: Args) => Promise<void>> = {
  submit,
  list: async () => list(),
  get,
};

const handler = handlers[cmd];
if (!handler) {
  console.error("Commands: submit | list | get");
  process.exit(1);
}
handler(args).catch((e) => {
  console.error(e);
  process.exit(1);
});
