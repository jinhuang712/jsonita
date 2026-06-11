/**
 * IPC 错误类型入口 — 调用方按错误契约决定处理方式。
 *
 * Spec ref: spec/03_ipc_boundary.md 与 spec/04_error_model.md。
 * 这里只提供 type guard 与 narrow helpers；当前没有全局 Toast/Modal dispatcher。
 */

export { isJsonitaError } from '../types/error';
export type { JsonitaError } from '../types/error';
