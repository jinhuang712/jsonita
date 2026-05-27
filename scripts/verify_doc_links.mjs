#!/usr/bin/env node
// Jsonita 本地链接 + 锚点校验脚本
//
// 用途：扫描 plan / spec / docs / index.html / *.md 中的本地链接，
// 验证 target 文件存在 + #anchor 对应 id 存在。外部 URL（http/https/mailto/tel）跳过。
//
// 用法：node scripts/verify_doc_links.mjs
// 退出码：0 = 全通过；1 = 有 broken link

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");

const IGNORE_DIRS = new Set(["node_modules", ".git", "target", "dist", ".vite", "build"]);
const SCAN_EXT = new Set([".html", ".md"]);

// ── 1. 遍历所有要扫描的文件 ──────────────────────────────
function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, out);
    } else if (SCAN_EXT.has(extname(ent.name))) {
      out.push(p);
    }
  }
  return out;
}

// ── 2. 解析单文件 ──────────────────────────────────
function parseFile(filePath) {
  let content = readFileSync(filePath, "utf-8");
  // 删 <script>...</script> 块（避免误识别 inline JS 字符串里的伪 href）
  content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  // 删 <style>...</style> 块（防御性，虽然 style 不太会有 href）
  content = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "");
  const ext = extname(filePath);
  const links = [];

  // HTML: <a href="...">
  if (ext === ".html") {
    const re = /<a\s+[^>]*?href="([^"]+)"/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      links.push({ href: m[1], line });
    }
  }

  // Markdown: [text](url) 同时排除 image ![alt](url)
  if (ext === ".md") {
    const re = /(?<!\!)\[(?:[^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const line = content.slice(0, m.index).split("\n").length;
      links.push({ href: m[1], line });
    }
  }

  // 所有 id="..." 收集（html 用；markdown 不强求）
  const ids = new Set();
  const idRe = /\sid="([^"]+)"/g;
  let m;
  while ((m = idRe.exec(content)) !== null) {
    ids.add(m[1]);
  }

  return { links, ids };
}

// ── 3. 验证 ───────────────────────────────────────
function isExternal(href) {
  return /^(https?:|mailto:|tel:|\/\/|data:|javascript:|#$)/i.test(href);
}

function verify(files) {
  const fileMap = new Map();
  for (const f of files) fileMap.set(f, parseFile(f));

  const broken = [];
  let total = 0, skipped = 0;

  for (const [f, { links }] of fileMap) {
    for (const { href, line } of links) {
      total++;
      if (isExternal(href)) { skipped++; continue; }

      const [pathPart, anchor] = href.split("#");
      const targetFile = pathPart
        ? resolve(dirname(f), pathPart)
        : f;

      // 是否存在
      if (!fileMap.has(targetFile)) {
        try {
          statSync(targetFile);
          // 文件存在但未扫（非 html/md ── 如 .json / .png / .ts）── 不验 anchor
          continue;
        } catch {
          broken.push({
            file: relative(ROOT, f),
            line,
            href,
            reason: `target file not found: ${pathPart || "(self)"}`
          });
          continue;
        }
      }

      // 验 anchor
      if (anchor) {
        const targetIds = fileMap.get(targetFile).ids;
        if (!targetIds.has(anchor)) {
          broken.push({
            file: relative(ROOT, f),
            line,
            href,
            reason: `anchor "${anchor}" not found in target`
          });
        }
      }
    }
  }

  return { total, skipped, broken };
}

// ── 4. 输出 ───────────────────────────────────────
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const files = walk(ROOT);
const { total, skipped, broken } = verify(files);
const checked = total - skipped;

if (broken.length === 0) {
  console.log(`${GREEN}✓${RESET} ${checked} local links checked, ${DIM}${skipped} external skipped${RESET}, ${GREEN}0 broken${RESET}`);
  process.exit(0);
} else {
  // 按文件分组输出
  const byFile = new Map();
  for (const b of broken) {
    if (!byFile.has(b.file)) byFile.set(b.file, []);
    byFile.get(b.file).push(b);
  }
  for (const [file, items] of byFile) {
    console.log(`\n${YELLOW}${file}${RESET}`);
    for (const it of items) {
      console.log(`  ${RED}✗${RESET} L${it.line}  ${it.href}`);
      console.log(`     ${DIM}${it.reason}${RESET}`);
    }
  }
  console.log(`\n${RED}Summary${RESET}: ${checked} local links checked, ${DIM}${skipped} external skipped${RESET}, ${RED}${broken.length} broken${RESET}`);
  process.exit(1);
}
