/**
 * JsonitaError — Rust 端 `#[serde(tag = "kind", content = "data")]` 跨 IPC 镜像。
 *
 * Spec ref: spec/S03-error-model.md 与 spec/appendix/A00-schemas.md。
 */

export type JsonitaError =
  | { kind: 'Parse'; data: { line: number; col: number; msg: string } }
  | { kind: 'UnwrapTimeout'; data: { ms: number; depth: number } }
  | { kind: 'Sqlite'; data: string }
  | { kind: 'Secrets'; data: string }
  | { kind: 'Http'; data: { status: number; body: string } }
  | { kind: 'AiInvalidJson'; data: { raw: string } }
  | { kind: 'RateLimit'; data: { retryAfterSec: number } }
  | { kind: 'Io'; data: string }
  | { kind: 'AiDisabled' };

export function isJsonitaError(e: unknown): e is JsonitaError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'kind' in e &&
    typeof (e as { kind: unknown }).kind === 'string'
  );
}
