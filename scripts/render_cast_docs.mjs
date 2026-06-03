#!/usr/bin/env node

import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");
const RENDERER_ROOT = process.env.CAST_A_DOC_ROOT || "/Users/jin.huang/.codex/skills/cast-a-doc";
const RENDER_HTML = resolve(RENDERER_ROOT, "scripts/render_html.py");

function docsInDir(dir) {
  return readdirSync(resolve(ROOT, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => [`${dir}/${entry.name}`, `${dir}/${basename(entry.name, ".json")}.html`]);
}

const DOCS = [
  ["site/index.cast.json", "index.html"],
  ["site/todo.json", "todo.html"],
  ["site/changelist.json", "changelist.html"],
  ["site/workflow.json", "workflow.html"],
  ...docsInDir("plan"),
  ...docsInDir("spec"),
];

function run(args) {
  const result = spawnSync("python3", args, {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const [source, output] of DOCS) {
  const sourcePath = resolve(ROOT, source);
  const outputPath = resolve(ROOT, output);
  mkdirSync(dirname(outputPath), { recursive: true });
  run([
    RENDER_HTML,
    "--input", sourcePath,
    "--output", outputPath,
    "--repo-root", ROOT,
    "--validate",
  ]);
}

writeFileSync(resolve(ROOT, ".cast-docs/rendered.txt"), DOCS.map(([source, output]) => `${source} -> ${output}`).join("\n") + "\n");
