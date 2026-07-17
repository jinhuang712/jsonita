/**
 * IPC 错误类型入口 — 调用方按错误契约决定处理方式。
 *
 * Spec ref: spec/20-architecture.md。
 * 这里只提供 type guard 与 narrow helpers；当前没有全局 Toast/Modal dispatcher。
 */

import { isJsonitaError } from '../types/error';

export { isJsonitaError };
export type { JsonitaError } from '../types/error';

/**
 * 把 IPC 错误格式化成简短可读英文串（错误文案与 AiFixPane 一致不走 locale）。
 * 非 JsonitaError（底层 reject / 非对象）回退 String()，避免出现 "[object Object]"。
 */
export function formatError(cause: unknown): string {
  if (!isJsonitaError(cause)) return String(cause);
  switch (cause.kind) {
    case 'Parse':
      return `Invalid JSON · line ${cause.data.line}, col ${cause.data.col}`;
    case 'UnwrapTimeout':
      return `Unwrap timed out after ${cause.data.ms}ms`;
    case 'Sqlite':
      return `Storage error · ${cause.data}`;
    case 'Secrets':
      return cause.data;
    case 'Http':
      return `HTTP ${cause.data.status} · ${cause.data.body}`;
    case 'AiInvalidJson':
      return 'AI returned invalid JSON';
    case 'AiCannotRepair': {
      const reason = cause.data.reason?.trim().slice(0, 160);
      return reason ? `AI couldn't repair this · ${reason}` : "AI couldn't repair this input";
    }
    case 'RateLimit':
      return `Rate limited · retry in ${cause.data.retryAfterSec}s`;
    case 'Io':
      return cause.data;
    case 'AiDisabled':
      return 'AI Fix is disabled';
    default:
      return (cause as { kind: string }).kind;
  }
}
