/**
 * 前端日志薄层。
 *
 * Spec ref: spec/15_logging.html § 8 WebView 端薄层。
 * 当前仅 `console.*` 输出，**不**走 IPC。`log_write` 转发到 Rust 同一文件是
 * reserved / future（spec/15 § 2.2）。
 *
 * API 形状已锁定：M1 加入 IPC 时调用点（其它模块的 `logger.error/warn/...`）零改动。
 */

type Level = 'error' | 'warn' | 'info' | 'debug';

function emit(
  level: Level,
  target: string,
  event: string,
  fields?: Record<string, unknown>,
): void {
  const consoleFn =
    level === 'debug' ? console.log : level === 'info' ? console.info : console[level];
  consoleFn(`[${target}] ${event}`, fields ?? {});
  // Reserved: if level !== 'debug' → invoke('log_write', { level, target, event, fields })
}

export const logger = {
  error: (target: string, event: string, fields?: Record<string, unknown>) =>
    emit('error', target, event, fields),
  warn: (target: string, event: string, fields?: Record<string, unknown>) =>
    emit('warn', target, event, fields),
  info: (target: string, event: string, fields?: Record<string, unknown>) =>
    emit('info', target, event, fields),
  debug: (target: string, event: string, fields?: Record<string, unknown>) =>
    emit('debug', target, event, fields),
};
