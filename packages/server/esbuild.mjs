import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import * as esbuild from "esbuild";

// Bundles the Lambda HTTP handler into dist/lambda/http.zip (consumed by infra/main.tf).
// Mongo's optional native deps are externalized so esbuild doesn't try to resolve
// packages that aren't installed.
const outdir = "dist/lambda";
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

await esbuild.build({
  entryPoints: { http: "src/lambda/http.ts" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  minify: true,
  sourcemap: false,
  outdir,
  outExtension: { ".js": ".mjs" },
  // @aws-sdk is on the Lambda runtime; the rest are optional mongodb peers that are
  // never installed (kerberos/snappy/etc.) and must not break the bundle. unpdf/mammoth
  // (résumé parsing) are pure JS and bundle fine.
  external: [
    "@aws-sdk/*",
    "mongodb-client-encryption",
    "kerberos",
    "snappy",
    "@mongodb-js/zstd",
    "aws4",
    "gcp-metadata",
    "socks",
  ],
  // ESM bundle that still needs CJS require() for a few transitive deps.
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

execSync(`cd ${outdir} && zip -q http.zip http.mjs`, { stdio: "inherit" });
// eslint-disable-next-line no-console -- build-script status output
console.log("Lambda bundle + zip built: dist/lambda/http.zip");
