/**
 * JsonitaError — Rust 端 `#[serde(tag = "kind", content = "data")]` 跨 IPC 镜像。
 *
 * Spec ref: spec/13_schemas.html § 1.1 错误类型表
 * UI 呈现矩阵: spec/02_ipc.html § 8
 */

export type JsonitaError =
  | { kind: 'Parse'; data: { line: number; col: number; msg: string } }
  | { kind: 'UnwrapTimeout'; data: { ms: number; depth: number } }
  | { kind: 'Sqlite'; data: string }
  | { kind: 'Keychain'; data: string }
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
