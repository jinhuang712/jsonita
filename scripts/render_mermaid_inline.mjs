#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");
const TARGET_DIRS = ["plan", "spec"];

function listHtmlFiles() {
  return TARGET_DIRS.flatMap((dir) =>
    readdirSync(resolve(ROOT, dir))
      .filter((name) => name.endsWith(".html"))
      .map((name) => resolve(ROOT, dir, name))
  );
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/g, "")
    .replace(/\s*xmlns:xlink="[^"]*"/g, "")
    .replace(/\s*style="max-width:[^"]*"/g, "")
    .trim();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function normalizeMermaidSource(source) {
  return source
    .replace(/sha256\[:8\]/g, "sha256 prefix8")
    .replace(/console\.\*/g, "console calls")
    .split("\n")
    .map((line) => line.replace(
      /([A-Za-z][A-Za-z0-9_]*)\[([^\]"]*?[()[\]:=<>/&$~·][^\]"]*?)\]/g,
      (_match, id, label) => `${id}["${label.replace(/"/g, '\\"')}"]`
    ).replace(
      /([A-Za-z][A-Za-z0-9_]*)\{([^}"]*?[()[\]:=<>/&$~·][^}"]*?)\}/g,
      (_match, id, label) => `${id}{"${label.replace(/"/g, '\\"')}"}`
    ))
    .join("\n");
}

function slugFor(file, index) {
  return `${basename(dirname(file))}-${basename(file, ".html")}-diagram-${index + 1}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const tempDir = mkdtempSync(resolve(tmpdir(), "jsonita-mermaid-"));
let changed = 0;

try {
  for (const file of listHtmlFiles()) {
    let html = readFileSync(file, "utf8");
    const matches = Array.from(html.matchAll(/<div class="mermaid">\s*([\s\S]*?)\s*<\/div>/g));
    if (matches.length === 0) continue;

    let nextHtml = html;
    for (const [index, match] of matches.entries()) {
      const source = normalizeMermaidSource(decodeHtmlEntities(match[1].trim()));
      const id = slugFor(file, index);
      const input = resolve(tempDir, `${id}.mmd`);
      const output = resolve(tempDir, `${id}.svg`);
      writeFileSync(input, source + "\n");
      const result = spawnSync("npx", ["-y", "@mermaid-js/mermaid-cli", "-i", input, "-o", output, "-b", "transparent"], {
        cwd: ROOT,
        encoding: "utf8",
      });
      if (result.status !== 0 || !existsSync(output)) {
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        throw new Error(`failed to render Mermaid diagram ${index + 1} in ${file}`);
      }
      const svg = sanitizeSvg(readFileSync(output, "utf8"));
      const figure = `<figure class="cast-diagram" data-diagram-source="mermaid" id="${id}">\n${svg}\n</figure>`;
      nextHtml = nextHtml.replace(match[0], figure);
      changed += 1;
    }

    if (nextHtml !== html) {
      writeFileSync(file, nextHtml);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Rendered ${changed} Mermaid diagram(s) to inline SVG.`);
