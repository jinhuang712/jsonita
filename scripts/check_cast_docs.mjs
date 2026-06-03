#!/usr/bin/env node

import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");
const RENDERER_ROOT = process.env.CAST_A_DOC_ROOT || "/Users/jin.huang/.codex/skills/cast-a-doc";
const VALIDATE_PROFILE = resolve(RENDERER_ROOT, "scripts/validate_project_profile.py");
const RENDER_HTML = resolve(RENDERER_ROOT, "scripts/render_html.py");

function docsInDir(dir) {
  return readdirSync(resolve(ROOT, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => [`${dir}/${entry.name}`, `${dir}/${basename(entry.name, ".json")}.html`]);
}

const PLAN_DOCS = docsInDir("plan");
const SPEC_DOCS = docsInDir("spec");
const DOCS = [
  ["site/index.cast.json", "index.html"],
  ["site/todo.json", "todo.html"],
  ["site/changelist.json", "changelist.html"],
  ["site/workflow.json", "workflow.html"],
  ...PLAN_DOCS,
  ...SPEC_DOCS,
];

const STRICT_HTML = DOCS.map(([, output]) => output);

function run(args, opts = {}) {
  const result = spawnSync(args[0], args.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    ...opts,
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result;
}

function fail(message) {
  console.error(`CAST check failed: ${message}`);
  process.exit(1);
}

run(["python3", VALIDATE_PROFILE, "--repo-root", ROOT], { stdio: "inherit" });

const tempDir = mkdtempSync(resolve(tmpdir(), "jsonita-cast-check-"));
try {
  for (const [source, output] of DOCS) {
    const tempOutput = resolve(tempDir, output);
    run([
      "python3",
      RENDER_HTML,
      "--input", resolve(ROOT, source),
      "--output", tempOutput,
      "--repo-root", ROOT,
      "--validate",
    ]);
    const actual = readFileSync(resolve(ROOT, output), "utf8");
    const expected = readFileSync(tempOutput, "utf8");
    if (actual !== expected) {
      fail(`${output} is stale relative to ${source}`);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

for (const rel of STRICT_HTML) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) fail(`${rel} does not exist`);
  const html = readFileSync(abs, "utf8");
  if (/<div\s+class=["']mermaid["']/.test(html)) {
    fail(`${rel} still contains raw Mermaid blocks`);
  }
  if (/cdn\.jsdelivr\.net\/npm\/mermaid|svg-pan-zoom/.test(html)) {
    fail(`${rel} still depends on runtime diagram CDN`);
  }
  if (/data:image\/svg\+xml/.test(html)) {
    fail(`${rel} contains data:image/svg+xml diagram fallback`);
  }
}

for (const [source, output] of [...PLAN_DOCS, ...SPEC_DOCS]) {
  if (!existsSync(resolve(ROOT, source))) fail(`${output} is missing CAST JSON source ${source}`);
  const html = readFileSync(resolve(ROOT, output), "utf8");
  if (!html.includes('data-locale-target="zh-CN"') || !html.includes('data-locale-target="en"')) {
    fail(`${output} is missing CAST bilingual locale switcher`);
  }
  if (!html.includes('data-renderer-owned="true"')) {
    fail(`${output} does not look rendered by cast-a-doc`);
  }
}

const indexSource = readFileSync(resolve(ROOT, "site/index.cast.json"), "utf8");
for (const forbidden of [
  "\"href\": \"site/todo.json\"",
  "\"href\": \"site/changelist.json\"",
  "\"href\": \"site/index.cast.json\"",
  "\"href\": \"plan/\"",
  "\"href\": \"spec/\"",
]) {
  if (indexSource.includes(forbidden)) {
    fail(`homepage primary source contains forbidden reader href ${forbidden}`);
  }
}

console.log("OK");
