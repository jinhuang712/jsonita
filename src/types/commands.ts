/**
 * IPC command 入参 / 出参类型 — Rust 端 `#[serde(rename_all = "camelCase")]` 跨 IPC 镜像。
 *
 * Spec ref: spec/appendix/schemas.md
 */

import type { IndentMode, OpType, QuoteStyle } from './enums';

// § 3.1 json_ops 选项
export interface FormatOpts {
  indent: IndentMode;
  sortKeys?: boolean;
  trailingNewline?: boolean;
}

export interface UnwrapOpts {
  timeoutMs?: number;
  maxDepth?: number | null;
}

export interface StringifyOpts {
  quote?: QuoteStyle;
  escapeUnicode?: boolean;
  minify?: boolean;
}

// § 3.2 history / session
export interface HistoryRow {
  id: number;
  createdAt: number;
  content: string;
  summary: string;
  contentHash: string;
  opType: OpType;
  pinned: boolean;
  starred: boolean;
}

export interface ListOpts {
  limit?: number;
  offset?: number;
  onlyPinned?: boolean;
  onlyStarred?: boolean;
}

export interface LastSession {
  content: string;
  opType: OpType;
  savedAt: number;
}

// § 3.5 window / system
export interface ClipboardSniff {
  text: string;
  looksLikeJson: boolean;
}

export interface ContentMetrics {
  maxLineChars: number;
  lineCount: number;
  bytes: number;
  nonWhitespaceChars: number;
  softWrapOn: boolean;
  fontSize: number;
}

export interface WindowResizedPayload {
  width: number;
  height: number;
  source: 'user' | 'auto';
}
